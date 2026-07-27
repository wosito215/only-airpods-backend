document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Lógica del Modo Claro / Oscuro ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        
        if (currentTheme === 'light') {
            htmlElement.setAttribute('data-theme', 'dark');
            themeToggleBtn.textContent = '☀️ Cambiar a Modo Día';
        } else {
            htmlElement.setAttribute('data-theme', 'light');
            themeToggleBtn.textContent = '🌙 Cambiar a Modo Noche';
        }
    });

    // --- 2. Lógica del Acordeón (Móviles) ---
    const accordions = document.querySelectorAll('.accordion-header');

    accordions.forEach(accordion => {
        accordion.addEventListener('click', function() {
            // Verifica si estamos en versión móvil (el icono está visible)
            const icon = this.querySelector('.icon');
            if (window.getComputedStyle(icon).display === 'none') {
                return; // Si es escritorio, no hace nada
            }

            // Selecciona la lista ul asociada al botón clickeado
            const content = this.nextElementSibling;
            
            // Alternar el icono entre + y -
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                icon.textContent = '+';
            } else {
                // Cierra otros acordeones abiertos (Opcional, mejora la UX)
                document.querySelectorAll('.accordion-content').forEach(el => {
                    el.style.maxHeight = null;
                });
                document.querySelectorAll('.icon').forEach(el => {
                    el.textContent = '+';
                });

                // Abre el acordeón actual
                content.style.maxHeight = content.scrollHeight + "px";
                icon.textContent = '-';
            }
        });
    });
});