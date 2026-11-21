# HostelHub

A complete beginner-friendly Hostel Management System built with:

- Python Flask
- SQLite database
- HTML/CSS/JavaScript
- Jinja2 templates
- Chart.js for dashboard analytics
- Werkzeug password hashing

## Included modules

### Student
1. Registration/Login
2. Dashboard
3. Profile
4. Room Details
5. Fee Management
6. Complaint Management
7. Visitor Management
8. Attendance
9. Hostel Facilities
10. Leave Requests
11. Notices

### Admin
1. Dashboard
2. Student Management
3. Room Management + allocation
4. Fee Management + payment recording
5. Complaint Management
6. Visitor Management
7. Attendance Management
8. Facility Management
9. Leave Management
10. Notice Management
11. Reports

## Requirements

Python 3.10+ recommended.

## Installation

Open a terminal in this project folder.

### Windows

```text
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open:

http://127.0.0.1:5000

## Demo admin login

Email:
admin@hostel.com

Password:
admin123

## Student login

Create a student account from:

http://127.0.0.1:5000/register

## Database

The application automatically creates `hostel.db` the first time it runs. No separate database server is required.

## Important

Change `app.secret_key` in `app.py` before using this outside a local college project.

## Reset database

Stop Flask and delete:

```text
hostel.db
```

Then run:

```text
python app.py
```

The database will be created again with demo rooms, facilities, notices and admin account.
