from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
from pathlib import Path
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "hostel.db"

app = Flask(__name__)
app.secret_key = "change-this-secret-key-in-production"


# ---------------- Database ----------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','student')),
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        dob TEXT,
        gender TEXT,
        course TEXT,
        year TEXT,
        address TEXT,
        room_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_no TEXT UNIQUE NOT NULL,
        block TEXT NOT NULL,
        floor TEXT NOT NULL,
        room_type TEXT NOT NULL,
        capacity INTEGER NOT NULL CHECK(capacity > 0),
        occupied INTEGER NOT NULL DEFAULT 0 CHECK(occupied >= 0)
    );

    CREATE TABLE IF NOT EXISTS fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        total_fee REAL NOT NULL,
        paid REAL NOT NULL DEFAULT 0,
        due_date TEXT,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fee_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        method TEXT NOT NULL,
        FOREIGN KEY(fee_id) REFERENCES fees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'Medium',
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        relation TEXT,
        purpose TEXT NOT NULL,
        visit_date TEXT NOT NULL,
        visit_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        attendance_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Present','Absent')),
        UNIQUE(student_id, attendance_date),
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS facilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Available',
        icon TEXT DEFAULT '🏨'
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        from_date TEXT NOT NULL,
        to_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        emergency_contact TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'Normal',
        created_at TEXT NOT NULL
    );
    """)

    # Seed admin
    admin = cur.execute("SELECT id FROM users WHERE email=?", ("admin@hostel.com",)).fetchone()
    if not admin:
        cur.execute(
            "INSERT INTO users(name,email,password,role,created_at) VALUES(?,?,?,?,?)",
            ("Hostel Administrator", "admin@hostel.com",
             generate_password_hash("admin123"), "admin", datetime.now().isoformat(timespec="seconds"))
        )

    # Seed rooms
    if cur.execute("SELECT COUNT(*) FROM rooms").fetchone()[0] == 0:
        rooms = [
            ("A-101","A","1","Single",1,0),
            ("A-102","A","1","Double",2,1),
            ("A-103","A","1","Double",2,2),
            ("A-104","A","1","Double",2,0),
            ("A-201","A","2","Triple",3,1),
            ("A-202","A","2","Double",2,0),
            ("A-203","A","2","Double",2,2),
            ("A-204","A","2","Double",2,1),
            ("B-101","B","1","Double",2,0),
            ("B-102","B","1","Triple",3,2),
            ("B-201","B","2","Single",1,0),
            ("B-202","B","2","Double",2,1),
        ]
        cur.executemany(
            "INSERT INTO rooms(room_no,block,floor,room_type,capacity,occupied) VALUES(?,?,?,?,?,?)",
            rooms
        )

    # Seed facilities
    if cur.execute("SELECT COUNT(*) FROM facilities").fetchone()[0] == 0:
        facilities = [
            ("Wi-Fi","High-speed internet in hostel blocks.","Available","📶"),
            ("Hot Water","Hot water facility during scheduled hours.","Available","🚿"),
            ("Electricity","24x7 power supply with backup.","Available","⚡"),
            ("Room Service","Regular room cleaning and maintenance.","Available","🧹"),
            ("Laundry","Laundry and washing facility.","Maintenance","🧺"),
            ("Study Room","Quiet common study area.","Available","📚"),
        ]
        cur.executemany(
            "INSERT INTO facilities(name,description,status,icon) VALUES(?,?,?,?)",
            facilities
        )

    # Seed notices
    if cur.execute("SELECT COUNT(*) FROM notices").fetchone()[0] == 0:
        now = datetime.now().isoformat(timespec="seconds")
        notices = [
            ("Fee Payment Deadline","Please complete pending hostel fees before the due date.","High",now),
            ("Hostel Inspection","Room inspection will be conducted this week. Keep rooms clean.","Normal",now),
            ("Maintenance Update","Laundry facility is temporarily under maintenance.","Medium",now),
        ]
        cur.executemany(
            "INSERT INTO notices(title,description,priority,created_at) VALUES(?,?,?,?)",
            notices
        )

    conn.commit()
    conn.close()


# ---------------- Helpers ----------------
def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login first.", "warning")
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped

def role_required(role):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if "user_id" not in session:
                return redirect(url_for("login"))
            if session.get("role") != role:
                flash("You are not authorized to access that page.", "danger")
                return redirect(url_for("dashboard"))
            return view(*args, **kwargs)
        return wrapped
    return decorator

def current_student():
    conn = get_db()
    student = conn.execute(
        "SELECT s.*, r.room_no, r.block, r.floor, r.room_type, r.capacity FROM students s "
        "LEFT JOIN rooms r ON s.room_id=r.id WHERE s.user_id=?",
        (session.get("user_id"),)
    ).fetchone()
    conn.close()
    return student

def validate_email(email):
    return "@" in email and "." in email.split("@")[-1]

@app.context_processor
def inject_globals():
    return {
        "current_year": datetime.now().year,
        "today": date.today().isoformat(),
        "logged_name": session.get("name"),
        "logged_role": session.get("role")
    }


# ---------------- Public/Auth ----------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email","").strip().lower()
        password = request.form.get("password","")

        if not email or not password:
            flash("Email and password are required.", "danger")
            return render_template("login.html")

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        conn.close()

        if not user or not check_password_hash(user["password"], password):
            flash("Invalid email or password.", "danger")
            return render_template("login.html")

        session.clear()
        session["user_id"] = user["id"]
        session["name"] = user["name"]
        session["role"] = user["role"]
        return redirect(url_for("dashboard"))

    return render_template("login.html")

@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name","").strip()
        student_id = request.form.get("student_id","").strip().upper()
        email = request.form.get("email","").strip().lower()
        phone = request.form.get("phone","").strip()
        dob = request.form.get("dob","")
        gender = request.form.get("gender","")
        course = request.form.get("course","").strip()
        year = request.form.get("year","")
        address = request.form.get("address","").strip()
        password = request.form.get("password","")
        confirm = request.form.get("confirm_password","")

        errors = []
        if len(name) < 2:
            errors.append("Name must contain at least 2 characters.")
        if not student_id:
            errors.append("Student ID is required.")
        if not validate_email(email):
            errors.append("Enter a valid email address.")
        if not (phone.isdigit() and len(phone) == 10):
            errors.append("Mobile number must contain exactly 10 digits.")
        if len(password) < 6:
            errors.append("Password must contain at least 6 characters.")
        if password != confirm:
            errors.append("Passwords do not match.")
        if not course:
            errors.append("Course is required.")

        conn = get_db()
        if not errors:
            if conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
                errors.append("Email is already registered.")
            if conn.execute("SELECT 1 FROM students WHERE student_id=?", (student_id,)).fetchone():
                errors.append("Student ID already exists.")

        if errors:
            conn.close()
            for e in errors:
                flash(e, "danger")
            return render_template("register.html")

        now = datetime.now().isoformat(timespec="seconds")
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users(name,email,password,role,created_at) VALUES(?,?,?,?,?)",
            (name,email,generate_password_hash(password),"student",now)
        )
        user_id = cur.lastrowid
        cur.execute(
            "INSERT INTO students(user_id,student_id,name,email,phone,dob,gender,course,year,address) "
            "VALUES(?,?,?,?,?,?,?,?,?,?)",
            (user_id,student_id,name,email,phone,dob,gender,course,year,address)
        )
        student_pk = cur.lastrowid
        # Create an initial fee record
        cur.execute(
            "INSERT INTO fees(student_id,total_fee,paid,due_date) VALUES(?,?,?,?)",
            (student_pk, 45000, 0, date.today().replace(month=12, day=15).isoformat())
        )
        conn.commit()
        conn.close()
        flash("Registration successful. Please login.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for("login"))

@app.route("/dashboard")
@login_required
def dashboard():
    if session["role"] == "admin":
        return redirect(url_for("admin_dashboard"))
    return redirect(url_for("student_dashboard"))


# ---------------- Student ----------------
@app.route("/student/dashboard")
@role_required("student")
def student_dashboard():
    student = current_student()
    conn = get_db()
    fee = conn.execute(
        "SELECT COALESCE(SUM(total_fee),0) total_fee, COALESCE(SUM(paid),0) paid "
        "FROM fees WHERE student_id=?", (student["id"],)
    ).fetchone()
    complaint_count = conn.execute(
        "SELECT COUNT(*) FROM complaints WHERE student_id=? AND status!='Resolved'", (student["id"],)
    ).fetchone()[0]
    present = conn.execute(
        "SELECT COUNT(*) FROM attendance WHERE student_id=? AND status='Present'", (student["id"],)
    ).fetchone()[0]
    total_att = conn.execute(
        "SELECT COUNT(*) FROM attendance WHERE student_id=?", (student["id"],)
    ).fetchone()[0]
    notices = conn.execute("SELECT * FROM notices ORDER BY id DESC LIMIT 4").fetchall()
    complaints = conn.execute(
        "SELECT * FROM complaints WHERE student_id=? ORDER BY id DESC LIMIT 4", (student["id"],)
    ).fetchall()
    conn.close()
    attendance_pct = round((present / total_att) * 100) if total_att else 0
    return render_template("student/dashboard.html", student=student, fee=fee,
                           complaint_count=complaint_count, attendance_pct=attendance_pct,
                           notices=notices, complaints=complaints)

@app.route("/student/profile", methods=["GET","POST"])
@role_required("student")
def student_profile():
    student = current_student()
    if request.method == "POST":
        phone = request.form.get("phone","").strip()
        address = request.form.get("address","").strip()
        if not (phone.isdigit() and len(phone)==10):
            flash("Enter a valid 10-digit mobile number.", "danger")
            return render_template("student/profile.html", student=student)
        conn = get_db()
        conn.execute("UPDATE students SET phone=?, address=? WHERE id=?", (phone,address,student["id"]))
        conn.commit()
        conn.close()
        flash("Profile updated successfully.", "success")
        return redirect(url_for("student_profile"))
    return render_template("student/profile.html", student=student)

@app.route("/student/room")
@role_required("student")
def student_room():
    student = current_student()
    return render_template("student/room.html", student=student)

@app.route("/student/fees")
@role_required("student")
def student_fees():
    student = current_student()
    conn = get_db()
    fees = conn.execute("SELECT * FROM fees WHERE student_id=? ORDER BY id DESC", (student["id"],)).fetchall()
    payments = conn.execute(
        "SELECT p.*, f.student_id FROM payments p JOIN fees f ON p.fee_id=f.id "
        "WHERE f.student_id=? ORDER BY p.id DESC", (student["id"],)
    ).fetchall()
    conn.close()
    total = sum(f["total_fee"] for f in fees)
    paid = sum(f["paid"] for f in fees)
    return render_template("student/fees.html", student=student, fees=fees, payments=payments,
                           total=total, paid=paid, pending=total-paid)

@app.route("/student/complaints", methods=["GET","POST"])
@role_required("student")
def student_complaints():
    student = current_student()
    conn = get_db()
    if request.method == "POST":
        subject = request.form.get("subject","").strip()
        category = request.form.get("category","")
        description = request.form.get("description","").strip()
        priority = request.form.get("priority","Medium")
        if len(subject) < 3 or len(description) < 10:
            flash("Subject and description must be filled correctly.", "danger")
        else:
            conn.execute(
                "INSERT INTO complaints(student_id,subject,category,description,priority,created_at) "
                "VALUES(?,?,?,?,?,?)",
                (student["id"],subject,category,description,priority,datetime.now().isoformat(timespec="seconds"))
            )
            conn.commit()
            flash("Complaint submitted successfully.", "success")
    complaints = conn.execute(
        "SELECT * FROM complaints WHERE student_id=? ORDER BY id DESC", (student["id"],)
    ).fetchall()
    conn.close()
    return render_template("student/complaints.html", complaints=complaints)

@app.route("/student/visitors", methods=["GET","POST"])
@role_required("student")
def student_visitors():
    student = current_student()
    conn = get_db()
    if request.method == "POST":
        name = request.form.get("name","").strip()
        mobile = request.form.get("mobile","").strip()
        relation = request.form.get("relation","").strip()
        purpose = request.form.get("purpose","").strip()
        visit_date = request.form.get("visit_date","")
        visit_time = request.form.get("visit_time","")
        if not name or not (mobile.isdigit() and len(mobile)==10) or not purpose or not visit_date or not visit_time:
            flash("Please enter valid visitor details.", "danger")
        elif visit_date < date.today().isoformat():
            flash("Visit date cannot be in the past.", "danger")
        else:
            conn.execute(
                "INSERT INTO visitors(student_id,name,mobile,relation,purpose,visit_date,visit_time,created_at) "
                "VALUES(?,?,?,?,?,?,?,?)",
                (student["id"],name,mobile,relation,purpose,visit_date,visit_time,
                 datetime.now().isoformat(timespec="seconds"))
            )
            conn.commit()
            flash("Visitor request submitted.", "success")
    visitors = conn.execute(
        "SELECT * FROM visitors WHERE student_id=? ORDER BY id DESC", (student["id"],)
    ).fetchall()
    conn.close()
    return render_template("student/visitors.html", visitors=visitors)

@app.route("/student/attendance")
@role_required("student")
def student_attendance():
    student = current_student()
    conn = get_db()
    records = conn.execute(
        "SELECT * FROM attendance WHERE student_id=? ORDER BY attendance_date DESC", (student["id"],)
    ).fetchall()
    present = sum(1 for r in records if r["status"]=="Present")
    total = len(records)
    pct = round(present/total*100) if total else 0
    conn.close()
    return render_template("student/attendance.html", records=records, present=present,
                           total=total, pct=pct)

@app.route("/student/facilities")
@role_required("student")
def student_facilities():
    conn = get_db()
    facilities = conn.execute("SELECT * FROM facilities ORDER BY id").fetchall()
    conn.close()
    return render_template("student/facilities.html", facilities=facilities)

@app.route("/student/leave", methods=["GET","POST"])
@role_required("student")
def student_leave():
    student = current_student()
    conn = get_db()
    if request.method == "POST":
        fd = request.form.get("from_date","")
        td = request.form.get("to_date","")
        reason = request.form.get("reason","").strip()
        contact = request.form.get("emergency_contact","").strip()
        if not fd or not td or not reason or not contact:
            flash("All leave fields are required.", "danger")
        elif fd > td or fd < date.today().isoformat():
            flash("Please enter a valid leave date range.", "danger")
        elif not (contact.isdigit() and len(contact)==10):
            flash("Emergency contact must be 10 digits.", "danger")
        else:
            conn.execute(
                "INSERT INTO leave_requests(student_id,from_date,to_date,reason,emergency_contact,created_at) "
                "VALUES(?,?,?,?,?,?)",
                (student["id"],fd,td,reason,contact,datetime.now().isoformat(timespec="seconds"))
            )
            conn.commit()
            flash("Leave request submitted.", "success")
    leaves = conn.execute(
        "SELECT * FROM leave_requests WHERE student_id=? ORDER BY id DESC", (student["id"],)
    ).fetchall()
    conn.close()
    return render_template("student/leave.html", leaves=leaves)

@app.route("/student/notices")
@role_required("student")
def student_notices():
    conn = get_db()
    notices = conn.execute("SELECT * FROM notices ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("student/notices.html", notices=notices)


# ---------------- Admin ----------------
@app.route("/admin/dashboard")
@role_required("admin")
def admin_dashboard():
    conn = get_db()
    total_students = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    total_rooms = conn.execute("SELECT COUNT(*) FROM rooms").fetchone()[0]
    total_capacity = conn.execute("SELECT COALESCE(SUM(capacity),0) FROM rooms").fetchone()[0]
    occupied = conn.execute("SELECT COALESCE(SUM(occupied),0) FROM rooms").fetchone()[0]
    available = total_capacity - occupied
    fee_collection = conn.execute("SELECT COALESCE(SUM(paid),0) FROM fees").fetchone()[0]
    pending_complaints = conn.execute(
        "SELECT COUNT(*) FROM complaints WHERE status!='Resolved'"
    ).fetchone()[0]
    pending_visitors = conn.execute(
        "SELECT COUNT(*) FROM visitors WHERE status='Pending'"
    ).fetchone()[0]
    pending_leaves = conn.execute(
        "SELECT COUNT(*) FROM leave_requests WHERE status='Pending'"
    ).fetchone()[0]
    # Monthly fee data for the last 6 months
    rows = conn.execute(
        "SELECT substr(payment_date,1,7) month, SUM(amount) total "
        "FROM payments GROUP BY month ORDER BY month DESC LIMIT 6"
    ).fetchall()
    fee_chart = list(reversed([(r["month"], r["total"]) for r in rows]))
    conn.close()
    return render_template("admin/dashboard.html",
        total_students=total_students,total_rooms=total_rooms,total_capacity=total_capacity,
        occupied=occupied,available=available,fee_collection=fee_collection,
        pending_complaints=pending_complaints,pending_visitors=pending_visitors,
        pending_leaves=pending_leaves,fee_chart=fee_chart)

@app.route("/admin/students", methods=["GET","POST"])
@role_required("admin")
def admin_students():
    conn = get_db()
    if request.method == "POST":
        name=request.form.get("name","").strip()
        sid=request.form.get("student_id","").strip().upper()
        email=request.form.get("email","").strip().lower()
        phone=request.form.get("phone","").strip()
        course=request.form.get("course","").strip()
        year=request.form.get("year","")
        password=request.form.get("password","")
        errors=[]
        if not name or not sid or not validate_email(email) or not (phone.isdigit() and len(phone)==10) or len(password)<6:
            errors.append("Check name, Student ID, email, 10-digit phone and password.")
        if conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
            errors.append("Email already exists.")
        if conn.execute("SELECT 1 FROM students WHERE student_id=?", (sid,)).fetchone():
            errors.append("Student ID already exists.")
        if errors:
            for e in errors: flash(e,"danger")
        else:
            cur=conn.cursor()
            cur.execute("INSERT INTO users(name,email,password,role,created_at) VALUES(?,?,?,?,?)",
                        (name,email,generate_password_hash(password),"student",datetime.now().isoformat(timespec="seconds")))
            uid=cur.lastrowid
            cur.execute("INSERT INTO students(user_id,student_id,name,email,phone,course,year) VALUES(?,?,?,?,?,?,?)",
                        (uid,sid,name,email,phone,course,year))
            conn.commit()
            flash("Student added successfully.","success")
    q=request.args.get("q","").strip()
    if q:
        students=conn.execute(
            "SELECT s.*,r.room_no FROM students s LEFT JOIN rooms r ON s.room_id=r.id "
            "WHERE s.name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ? ORDER BY s.id DESC",
            (f"%{q}%",f"%{q}%",f"%{q}%")
        ).fetchall()
    else:
        students=conn.execute(
            "SELECT s.*,r.room_no FROM students s LEFT JOIN rooms r ON s.room_id=r.id ORDER BY s.id DESC"
        ).fetchall()
    conn.close()
    return render_template("admin/students.html", students=students, q=q)

@app.route("/admin/students/delete/<int:student_id>", methods=["POST"])
@role_required("admin")
def admin_student_delete(student_id):
    conn=get_db()
    student=conn.execute("SELECT room_id FROM students WHERE id=?", (student_id,)).fetchone()
    if student and student["room_id"]:
        conn.execute("UPDATE rooms SET occupied=CASE WHEN occupied>0 THEN occupied-1 ELSE 0 END WHERE id=?",
                     (student["room_id"],))
    conn.execute("DELETE FROM students WHERE id=?", (student_id,))
    conn.commit(); conn.close()
    flash("Student deleted.","success")
    return redirect(url_for("admin_students"))

@app.route("/admin/rooms", methods=["GET","POST"])
@role_required("admin")
def admin_rooms():
    conn=get_db()
    if request.method=="POST":
        room_no=request.form.get("room_no","").strip().upper()
        block=request.form.get("block","").strip().upper()
        floor=request.form.get("floor","").strip()
        room_type=request.form.get("room_type","")
        try: capacity=int(request.form.get("capacity","0"))
        except: capacity=0
        if not room_no or not block or not floor or capacity<1:
            flash("Enter valid room details.","danger")
        elif conn.execute("SELECT 1 FROM rooms WHERE room_no=?", (room_no,)).fetchone():
            flash("Room number already exists.","danger")
        else:
            conn.execute("INSERT INTO rooms(room_no,block,floor,room_type,capacity,occupied) VALUES(?,?,?,?,?,0)",
                         (room_no,block,floor,room_type,capacity))
            conn.commit(); flash("Room added.","success")
    rooms=conn.execute("SELECT * FROM rooms ORDER BY block,floor,room_no").fetchall()
    conn.close()
    return render_template("admin/rooms.html", rooms=rooms)

@app.route("/admin/rooms/delete/<int:room_id>", methods=["POST"])
@role_required("admin")
def admin_room_delete(room_id):
    conn=get_db()
    room=conn.execute("SELECT occupied FROM rooms WHERE id=?", (room_id,)).fetchone()
    if room and room["occupied"]>0:
        flash("Cannot delete an occupied room.","danger")
    else:
        conn.execute("DELETE FROM rooms WHERE id=?", (room_id,))
        conn.commit(); flash("Room deleted.","success")
    conn.close()
    return redirect(url_for("admin_rooms"))

@app.route("/admin/rooms/allocate", methods=["POST"])
@role_required("admin")
def admin_allocate_room():
    sid=request.form.get("student_id")
    rid=request.form.get("room_id")
    conn=get_db()
    student=conn.execute("SELECT * FROM students WHERE id=?", (sid,)).fetchone()
    room=conn.execute("SELECT * FROM rooms WHERE id=?", (rid,)).fetchone()
    if not student or not room:
        flash("Invalid student or room.","danger")
    elif room["occupied"]>=room["capacity"]:
        flash("Room is full. Allocation rejected.","danger")
    else:
        if student["room_id"]:
            conn.execute("UPDATE rooms SET occupied=CASE WHEN occupied>0 THEN occupied-1 ELSE 0 END WHERE id=?",
                         (student["room_id"],))
        conn.execute("UPDATE students SET room_id=? WHERE id=?", (room["id"],student["id"]))
        conn.execute("UPDATE rooms SET occupied=occupied+1 WHERE id=?", (room["id"],))
        conn.commit(); flash(f"Room {room['room_no']} allocated successfully.","success")
    conn.close()
    return redirect(url_for("admin_rooms"))

@app.route("/admin/fees", methods=["GET","POST"])
@role_required("admin")
def admin_fees():
    conn=get_db()
    if request.method=="POST":
        fee_id=request.form.get("fee_id")
        amount=request.form.get("amount","")
        method=request.form.get("method","UPI")
        try: amount=float(amount)
        except: amount=-1
        fee=conn.execute("SELECT * FROM fees WHERE id=?", (fee_id,)).fetchone()
        if not fee or amount<=0:
            flash("Enter a valid payment amount.","danger")
        elif amount > fee["total_fee"]-fee["paid"]:
            flash("Payment cannot exceed pending amount.","danger")
        else:
            conn.execute("UPDATE fees SET paid=paid+? WHERE id=?", (amount,fee_id))
            conn.execute("INSERT INTO payments(fee_id,amount,payment_date,method) VALUES(?,?,?,?)",
                         (fee_id,amount,date.today().isoformat(),method))
            conn.commit(); flash("Payment recorded successfully.","success")
    fees=conn.execute(
        "SELECT f.*,s.name,s.student_id FROM fees f JOIN students s ON f.student_id=s.id ORDER BY f.id DESC"
    ).fetchall()
    students=conn.execute("SELECT id,student_id,name FROM students ORDER BY name").fetchall()
    conn.close()
    return render_template("admin/fees.html", fees=fees, students=students)

@app.route("/admin/complaints")
@role_required("admin")
def admin_complaints():
    conn=get_db()
    complaints=conn.execute(
        "SELECT c.*,s.name,s.student_id FROM complaints c JOIN students s ON c.student_id=s.id ORDER BY c.id DESC"
    ).fetchall()
    conn.close()
    return render_template("admin/complaints.html", complaints=complaints)

@app.route("/admin/complaints/status/<int:complaint_id>", methods=["POST"])
@role_required("admin")
def admin_complaint_status(complaint_id):
    status=request.form.get("status","Pending")
    if status not in ("Pending","In Progress","Resolved"):
        status="Pending"
    conn=get_db(); conn.execute("UPDATE complaints SET status=? WHERE id=?", (status,complaint_id))
    conn.commit(); conn.close()
    flash("Complaint status updated.","success")
    return redirect(url_for("admin_complaints"))

@app.route("/admin/visitors")
@role_required("admin")
def admin_visitors():
    conn=get_db()
    visitors=conn.execute(
        "SELECT v.*,s.name AS student_name,s.student_id FROM visitors v JOIN students s ON v.student_id=s.id ORDER BY v.id DESC"
    ).fetchall()
    conn.close()
    return render_template("admin/visitors.html", visitors=visitors)

@app.route("/admin/visitors/status/<int:visitor_id>", methods=["POST"])
@role_required("admin")
def admin_visitor_status(visitor_id):
    status=request.form.get("status","Pending")
    if status not in ("Pending","Approved","Rejected"): status="Pending"
    conn=get_db(); conn.execute("UPDATE visitors SET status=? WHERE id=?", (status,visitor_id))
    conn.commit(); conn.close()
    flash("Visitor status updated.","success")
    return redirect(url_for("admin_visitors"))

@app.route("/admin/attendance", methods=["GET","POST"])
@role_required("admin")
def admin_attendance():
    conn=get_db()
    students=conn.execute("SELECT id,student_id,name FROM students ORDER BY name").fetchall()
    if request.method=="POST":
        student_id=request.form.get("student_id")
        att_date=request.form.get("attendance_date")
        status=request.form.get("status")
        if not student_id or not att_date or status not in ("Present","Absent"):
            flash("Enter valid attendance details.","danger")
        else:
            conn.execute(
                "INSERT INTO attendance(student_id,attendance_date,status) VALUES(?,?,?) "
                "ON CONFLICT(student_id,attendance_date) DO UPDATE SET status=excluded.status",
                (student_id,att_date,status)
            )
            conn.commit(); flash("Attendance saved.","success")
    records=conn.execute(
        "SELECT a.*,s.name,s.student_id FROM attendance a JOIN students s ON a.student_id=s.id "
        "ORDER BY a.attendance_date DESC,a.id DESC LIMIT 100"
    ).fetchall()
    conn.close()
    return render_template("admin/attendance.html", students=students, records=records)

@app.route("/admin/facilities", methods=["GET","POST"])
@role_required("admin")
def admin_facilities():
    conn=get_db()
    if request.method=="POST":
        fid=request.form.get("facility_id")
        status=request.form.get("status","Available")
        if status not in ("Available","Maintenance","Unavailable"): status="Available"
        conn.execute("UPDATE facilities SET status=? WHERE id=?", (status,fid))
        conn.commit(); flash("Facility status updated.","success")
    facilities=conn.execute("SELECT * FROM facilities ORDER BY id").fetchall()
    conn.close()
    return render_template("admin/facilities.html", facilities=facilities)

@app.route("/admin/leave")
@role_required("admin")
def admin_leave():
    conn=get_db()
    leaves=conn.execute(
        "SELECT l.*,s.name,s.student_id FROM leave_requests l JOIN students s ON l.student_id=s.id ORDER BY l.id DESC"
    ).fetchall()
    conn.close()
    return render_template("admin/leave.html", leaves=leaves)

@app.route("/admin/leave/status/<int:leave_id>", methods=["POST"])
@role_required("admin")
def admin_leave_status(leave_id):
    status=request.form.get("status","Pending")
    if status not in ("Pending","Approved","Rejected"): status="Pending"
    conn=get_db(); conn.execute("UPDATE leave_requests SET status=? WHERE id=?", (status,leave_id))
    conn.commit(); conn.close()
    flash("Leave request updated.","success")
    return redirect(url_for("admin_leave"))

@app.route("/admin/notices", methods=["GET","POST"])
@role_required("admin")
def admin_notices():
    conn=get_db()
    if request.method=="POST":
        title=request.form.get("title","").strip()
        description=request.form.get("description","").strip()
        priority=request.form.get("priority","Normal")
        if len(title)<3 or len(description)<5:
            flash("Enter a valid notice title and description.","danger")
        else:
            conn.execute(
                "INSERT INTO notices(title,description,priority,created_at) VALUES(?,?,?,?)",
                (title,description,priority,datetime.now().isoformat(timespec="seconds"))
            )
            conn.commit(); flash("Notice published.","success")
    notices=conn.execute("SELECT * FROM notices ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("admin/notices.html", notices=notices)

@app.route("/admin/notices/delete/<int:notice_id>", methods=["POST"])
@role_required("admin")
def admin_notice_delete(notice_id):
    conn=get_db(); conn.execute("DELETE FROM notices WHERE id=?", (notice_id,))
    conn.commit(); conn.close()
    flash("Notice deleted.","success")
    return redirect(url_for("admin_notices"))

@app.route("/admin/reports")
@role_required("admin")
def admin_reports():
    conn=get_db()
    students=conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    rooms=conn.execute("SELECT COUNT(*) FROM rooms").fetchone()[0]
    occupied=conn.execute("SELECT COALESCE(SUM(occupied),0) FROM rooms").fetchone()[0]
    capacity=conn.execute("SELECT COALESCE(SUM(capacity),0) FROM rooms").fetchone()[0]
    total_fee=conn.execute("SELECT COALESCE(SUM(total_fee),0) FROM fees").fetchone()[0]
    paid=conn.execute("SELECT COALESCE(SUM(paid),0) FROM fees").fetchone()[0]
    complaints=conn.execute("SELECT COUNT(*) FROM complaints").fetchone()[0]
    resolved=conn.execute("SELECT COUNT(*) FROM complaints WHERE status='Resolved'").fetchone()[0]
    visitors=conn.execute("SELECT COUNT(*) FROM visitors").fetchone()[0]
    approved_visitors=conn.execute("SELECT COUNT(*) FROM visitors WHERE status='Approved'").fetchone()[0]
    conn.close()
    return render_template("admin/reports.html", students=students,rooms=rooms,occupied=occupied,
                           capacity=capacity,total_fee=total_fee,paid=paid,complaints=complaints,
                           resolved=resolved,visitors=visitors,approved_visitors=approved_visitors)

# ---------------- Error handling ----------------
@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
