// ═══════════════════════════════════════════════════════════
// LexVault — Client-Side JavaScript
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // ── Sidebar Toggle (Mobile) ────────────────────────────
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // ── Auto-dismiss flash messages ────────────────────────
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-8px)';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });

  // ── Alert close buttons ────────────────────────────────
  document.querySelectorAll('.alert-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const alert = btn.closest('.alert');
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-8px)';
      setTimeout(() => alert.remove(), 200);
    });
  });

  // ── Confirm delete ─────────────────────────────────────
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', (e) => {
      const message = el.getAttribute('data-confirm') || 'Are you sure?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });

  // ── Active sidebar link ────────────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // ── Form validation feedback ───────────────────────────
  document.querySelectorAll('.auth-form form').forEach(form => {
    form.addEventListener('submit', function(e) {
      const btn = form.querySelector('.btn-primary');
      if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Processing...';
        btn.disabled = true;
      }
    });
  });
});
