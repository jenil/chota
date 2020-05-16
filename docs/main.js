function switchMode(el) {
  const bodyClass = document.body.classList;
  bodyClass.contains('dark')
    ? (el.innerHTML = '☀️', bodyClass.remove('dark'))
    : (el.innerHTML = '🌙', bodyClass.add('dark')); 
}
