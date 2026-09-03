(function() {
  function initSessionControls() {
    const controls = document.getElementById('session-controls');
    const wakeLockToggle = document.getElementById('wake-lock-toggle');
    const progressText = document.getElementById('progress-text');
    const resetButton = document.getElementById('reset-session');

    // Robust exercise selection: 
    // 1. Explicitly marked with data-exercise-card
    // 2. .group or .bg-white containers that have an h3/h4 header
    const exercises = Array.from(document.querySelectorAll('[data-exercise-card], .group, .bg-white'))
      .filter(el => {
        if (el.hasAttribute('data-exercise-card')) return true;
        const hasHeader = el.querySelector('h3, h4');
        const isNotMainCard = !el.querySelector('h1') && !el.querySelector('h2');
        return hasHeader && isNotMainCard;
      })
      .filter((el, index, self) => self.indexOf(el) === index);

    let wakeLock = null;

    // Show controls with a slight delay
    setTimeout(() => {
      if (controls) controls.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 500);

    // Wake Lock Logic
    if ('wakeLock' in navigator && wakeLockToggle) {
      async function requestWakeLock() {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          
          // Listen for system-initiated release
          wakeLock.addEventListener('release', () => {
            if (wakeLockToggle.checked && document.visibilityState === 'visible') {
              requestWakeLock();
            }
          });
        } catch (err) {
          wakeLockToggle.checked = false;
          console.warn('Wake Lock request failed:', err);
        }
      }

      wakeLockToggle.addEventListener('change', async () => {
        if (wakeLockToggle.checked) {
          await requestWakeLock();
        } else if (wakeLock) {
          try {
            await wakeLock.release();
          } catch (err) {
            console.warn('Error releasing wake lock:', err);
          }
          wakeLock = null;
        }
      });

      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && wakeLockToggle.checked) {
          await requestWakeLock();
        }
      });
    } else if (wakeLockToggle) {
      wakeLockToggle.parentElement.style.display = 'none';
    }

    // Progress & Done Logic
    function updateProgress() {
      if (!progressText) return;
      const doneCount = document.querySelectorAll('.exercise-done').length;
      progressText.textContent = `${doneCount}/${exercises.length} Done`;
    }

    exercises.forEach((ex) => {
      if (ex.querySelector('button[data-session-controls]')) return;

      ex.classList.add('relative');
      const btn = document.createElement('button');
      btn.setAttribute('data-session-controls', '1');
      btn.className = 'absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm hover:scale-110 active:scale-95 transition-all z-10';
      btn.innerHTML = `
        <span class="undone-icon text-slate-400 dark:text-slate-500 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>
        </span>
        <span class="done-icon hidden text-emerald-600 dark:text-emerald-500 transition-transform duration-300 scale-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
        </span>
      `;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isDone = ex.classList.toggle('exercise-done');
        ex.classList.toggle('opacity-50', isDone);
        
        const undone = btn.querySelector('.undone-icon');
        const done = btn.querySelector('.done-icon');
        
        if (isDone) {
          if (undone) undone.classList.add('hidden');
          if (done) {
            done.classList.remove('hidden');
            setTimeout(() => done.classList.remove('scale-0'), 10);
          }
        } else {
          if (done) {
            done.classList.add('scale-0');
            setTimeout(() => {
              done.classList.add('hidden');
              if (undone) undone.classList.remove('hidden');
            }, 300);
          }
        }
        updateProgress();
      });

      ex.appendChild(btn);
    });

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        exercises.forEach(ex => {
          ex.classList.remove('exercise-done', 'opacity-50');
          const btn = ex.querySelector('button[data-session-controls]');
          if (btn) {
            const undone = btn.querySelector('.undone-icon');
            const done = btn.querySelector('.done-icon');
            if (undone && done) {
              done.classList.add('scale-0');
              done.classList.add('hidden');
              undone.classList.remove('hidden');
            }
          }
        });
        updateProgress();
      });
    }

    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionControls);
  } else {
    initSessionControls();
  }
})();
