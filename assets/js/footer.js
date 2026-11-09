(function () {
  function bindFooterAccordions() {
    document.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest('.footer__accordion-button');
      if (!button) {
        return;
      }

      const expanded = button.getAttribute('aria-expanded') === 'true';
      const content = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(!expanded));

      if (content) {
        content.style.maxHeight = expanded ? '0px' : content.scrollHeight + 'px';
      }
    });
  }

  function renderSharedFooter(markup) {
    const documentFragment = new DOMParser().parseFromString(markup, 'text/html');
    const sharedFooter = documentFragment.querySelector('footer.footer');
    if (!sharedFooter) {
      throw new Error('Shared footer component has no footer element');
    }

    const currentFooter = document.querySelector('footer.footer');
    if (currentFooter) {
      currentFooter.replaceWith(sharedFooter);
    } else {
      document.body.appendChild(sharedFooter);
    }
  }

  bindFooterAccordions();
  fetch('/assets/components/footer.html').then(function (response) {
    if (!response.ok) {
      throw new Error('Shared footer request failed with HTTP ' + response.status);
    }
    return response.text();
  }).then(renderSharedFooter).catch(function (error) {
    console.error('Unable to load the shared EconomicLab footer', error);
  });
})();
