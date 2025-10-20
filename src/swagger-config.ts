export const swaggerConfig = {
  customJsStr: `
    window.onload = function() {
      setTimeout(() => {
        const urls = [
          { url: '/docs-json', name: 'API Gateway' },
          { url: 'http://localhost:3000/api/docs-json', name: 'Auth Service' },
          { url: 'http://localhost:3500/api/docs-json', name: 'Users Service' }
        ];
        
        // Crear dropdown personalizado si no existe
        if (!document.querySelector('.custom-swagger-dropdown')) {
          const dropdown = document.createElement('select');
          dropdown.className = 'custom-swagger-dropdown';
          dropdown.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 9999; padding: 5px;';
          
          urls.forEach(item => {
            const option = document.createElement('option');
            option.value = item.url;
            option.textContent = item.name;
            dropdown.appendChild(option);
          });
          
          dropdown.addEventListener('change', (e) => {
            window.location.href = e.target.value === '/docs-json' ? '/docs' : e.target.value.replace('-json', '');
          });
          
          document.body.appendChild(dropdown);
        }
      }, 1000);
    }
  `
};