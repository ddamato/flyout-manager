const flyoutManager = new FlyoutManager();
const target = document.querySelector('.target');
const flyout = document.querySelector('.flyout');

target.addEventListener('targetmove', ({ detail }) => {
  const { top, left } = detail;
  flyout.style.setProperty('--target-left', `${left}px`);
  flyout.style.setProperty('--target-top', `${top}px`);
})

target.addEventListener('targetvisible', ({ detail }) => {
  const { layer, container } = detail;
  flyout.style.setProperty('--target-visible', Number(container && layer));
})

flyoutManager.then(mgr => mgr.observe(target)).catch(err => console.log(err));
