function toggleSidebar(){document.getElementById('sidebar')?.classList.toggle('open')}
function togglePassword(id,button){
  const input=document.getElementById(id); if(!input)return;
  input.type=input.type==='password'?'text':'password';
  if(button){
    const isVisible=input.type==='text';
    button.setAttribute('aria-label',isVisible?'Hide password':'Show password');
    button.querySelector('[data-eye-icon]').hidden=isVisible;
    button.querySelector('[data-eye-off-icon]').hidden=!isVisible;
  }
}
function openModal(id){document.getElementById(id)?.classList.add('open')}
function closeModal(id){document.getElementById(id)?.classList.remove('open')}
function confirmDelete(item){return confirm('Are you sure you want to delete '+item+'? This action cannot be undone.')}
function validatePhone(id){
  const e=document.getElementById(id); if(!e)return true;
  if(!/^\d{10}$/.test(e.value)){alert('Mobile number must contain exactly 10 digits.');e.focus();return false}
  return true;
}
function validateLogin(){
  const email=document.getElementById('email').value.trim(), pass=document.getElementById('password').value;
  if(!email.includes('@')){alert('Please enter a valid email address.');return false}
  if(pass.length<1){alert('Password is required.');return false}
  return true;
}
function validateRegistration(){
  const phone=document.getElementById('phone').value.trim(), p=document.getElementById('reg_password').value, c=document.getElementById('reg_confirm').value;
  if(!/^\d{10}$/.test(phone)){alert('Mobile number must contain exactly 10 digits.');return false}
  if(p.length<6){alert('Password must contain at least 6 characters.');return false}
  if(p!==c){alert('Passwords do not match.');return false}
  return true;
}
function validateVisitor(){
  const m=document.getElementById('visitor_mobile').value.trim(), d=document.getElementById('visit_date').value;
  if(!/^\d{10}$/.test(m)){alert('Visitor mobile number must contain exactly 10 digits.');return false}
  if(d && d < new Date().toISOString().slice(0,10)){alert('Visit date cannot be in the past.');return false}
  return true;
}
function validateLeave(){
  const f=document.getElementById('from_date').value,t=document.getElementById('to_date').value,c=document.getElementById('emergency_contact').value;
  if(f>t){alert('To date must be on or after From date.');return false}
  if(!/^\d{10}$/.test(c)){alert('Emergency contact must contain exactly 10 digits.');return false}
  return true;
}
function validateAdminStudent(){
  const p=document.getElementById('admin_phone').value.trim();
  if(!/^\d{10}$/.test(p)){alert('Phone must contain exactly 10 digits.');return false}
  return true;
}
function validatePayment(){
  const amount=document.querySelector('input[name="amount"]').value;
  if(Number(amount)<=0){alert('Payment amount must be greater than zero.');return false}
  return true;
}
document.addEventListener('click',e=>{
  if(e.target.classList.contains('modal')) e.target.classList.remove('open');
});
setTimeout(()=>document.querySelectorAll('.flash').forEach(e=>{setTimeout(()=>e.remove(),5000)}),100);
