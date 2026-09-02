// scripts/session-controls.js
// Externalized session controls: wake lock + exercise progress UI
// Exports initSessionControls() so it can be imported elsewhere; also runs automatically when loaded.
export function initSessionControls() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    const controls = document.getElementById('session-controls');
    const wakeLockToggle = document.getElementById('wake-lock-toggle');
    const progressText = document.getElementById('progress-text');
    const resetButton = document.getElementById('reset-session');

    // Robust exercise selection: find headers and get their container cards
    const exercises = Array.from(document.querySelectorAll('h3, h4'))
      .map(h => h.closest('.group, .bg-white'))
      .filter((el, index, self) => el && self.indexOf(el) === index && !el.querySelector('h1') && !el.querySelector('h2'));

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
        } catch (err) {
          // If request fails, make sure toggle reflects state
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
        // Some browsers require re-requesting the lock when visibility changes
        if (wakeLock !== null && document.visibilityState === 'visible') {
          await requestWakeLock();
        }
      });
    } else if (wakeLockToggle) {
      // Hide the control if Wake Lock API isn't available
      wakeLockToggle.parentElement.style.display = 'none';
    }

    // Progress & Done Logic
    function updateProgress() {
      if (!progressText) return;
      const doneCount = document.querySelectorAll('.exercise-done').length;
      progressText.textContent = `${doneCount}/${exercises.length} Done`;
    }

    exercises.forEach((ex) => {
      // Ensure we don't duplicate buttons when module is re-run
      if (ex.querySelector('button[data-session-controls]')) return;

      ex.classList.add('relative'); // Ensure absolute positioning works for the button
      const btn = document.createElement('button');
      btn.setAttribute('data-session-controls', '1');
      btn.className = 'absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm';
      btn.innerHTML = `
        <span class="undone-icon text-slate-400 dark:text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>
        </span>
        <span class="done-icon hidden text-emerald-600 dark:text-emerald-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </span>
      `;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isDone = ex.classList.toggle('exercise-done');
        ex.classList.toggle('opacity-50', isDone);
        const undone = btn.querySelector('.undone-icon');
        const done = btn.querySelector('.done-icon');
        if (undone && done) {
          undone.classList.toggle('hidden', isDone);
          done.classList.toggle('hidden', !isDone);
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
              undone.classList.remove('hidden');
              done.classList.add('hidden');
            }
          }
        });
        updateProgress();
      });
    }

    updateProgress();
  });
}

// Auto-run when module is loaded in a page
initSessionControls();
