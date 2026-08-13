/**
 * FlyRank Widget Bundle v1
 * ------------------------
 * This is the ENTIRE payload a customer's browser downloads when they paste
 * the embed snippet. It is intentionally dependency-free vanilla JS so it
 * stays tiny and never conflicts with whatever framework the host page runs.
 *
 * Flow: read data-widget-id off our own <script> tag -> fetch cached config
 * -> render a minimal form -> POST the submission back, cross-origin.
 */
(function () {
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var widgetId = currentScript.getAttribute('data-widget-id');
  if (!widgetId) {
    console.error('[FlyRank Widget] Missing data-widget-id attribute on script tag.');
    return;
  }

  // Derive the API origin from this script's own src, so the snippet works
  // regardless of which environment (local/staging/prod) it was copied from.
  var scriptUrl = new URL(currentScript.src);
  var apiOrigin = scriptUrl.origin;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'style') Object.assign(node.style, attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function inputForField(field) {
    var wrapper = el('div', { style: { marginBottom: '10px' } });
    var label = el('label', {
      style: { display: 'block', fontSize: '12px', marginBottom: '4px', fontFamily: 'sans-serif', color: '#333' },
    }, [field.label + (field.required ? ' *' : '')]);

    var input;
    if (field.type === 'textarea') {
      input = el('textarea', { name: field.name, rows: '3', style: { width: '100%', boxSizing: 'border-box', padding: '6px', fontFamily: 'sans-serif' } });
    } else if (field.type === 'checkbox') {
      input = el('input', { type: 'checkbox', name: field.name });
    } else {
      input = el('input', {
        type: field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text',
        name: field.name,
        style: { width: '100%', boxSizing: 'border-box', padding: '6px', fontFamily: 'sans-serif' },
      });
    }
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input };
  }

  fetch(apiOrigin + '/public/widgets/' + widgetId + '/config')
    .then(function (r) {
      if (!r.ok) throw new Error('Config request failed: ' + r.status);
      return r.json();
    })
    .then(function (payload) {
      renderWidget(payload.widget);
    })
    .catch(function (err) {
      console.error('[FlyRank Widget] Failed to load widget config:', err);
    });

  function renderWidget(widget) {
    var container = el('div', {
      id: 'flyrank-widget-' + widget.id,
      style: {
        position: widget.displayOptions.position === 'inline' ? 'static' : 'fixed',
        bottom: '20px',
        right: widget.displayOptions.position === 'bottom-left' ? 'auto' : '20px',
        left: widget.displayOptions.position === 'bottom-left' ? '20px' : 'auto',
        width: '280px',
        background: widget.displayOptions.theme === 'dark' ? '#1f2430' : '#ffffff',
        color: widget.displayOptions.theme === 'dark' ? '#f5f5f5' : '#1a1a1a',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        padding: '16px',
        zIndex: 999999,
        fontFamily: 'sans-serif',
      },
    });

    var title = el('div', { style: { fontWeight: '700', marginBottom: '4px' } }, [widget.title]);
    container.appendChild(title);

    if (widget.description) {
      container.appendChild(el('div', { style: { fontSize: '12px', opacity: '0.8', marginBottom: '10px' } }, [widget.description]));
    }

    var form = el('form', {});
    var inputs = {};
    widget.fields.forEach(function (field) {
      var pair = inputForField(field);
      inputs[field.name] = pair.input;
      form.appendChild(pair.wrapper);
    });

    // Honeypot — hidden from real visitors, catnip for bots that fill every field.
    var honeypot = el('input', {
      type: 'text',
      name: 'website',
      tabindex: '-1',
      autocomplete: 'off',
      style: { position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: '0' },
    });
    form.appendChild(honeypot);

    var statusEl = el('div', { style: { fontSize: '12px', marginTop: '8px' } });
    var submitBtn = el('button', {
      type: 'submit',
      style: {
        width: '100%', padding: '8px', border: 'none', borderRadius: '6px',
        background: '#5b5bd6', color: '#fff', fontWeight: '600', cursor: 'pointer',
      },
    }, [widget.buttonText || 'Submit']);
    form.appendChild(submitBtn);
    form.appendChild(statusEl);

    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      submitBtn.disabled = true;
      statusEl.textContent = 'Sending…';

      var data = {};
      widget.fields.forEach(function (field) {
        var input = inputs[field.name];
        data[field.name] = field.type === 'checkbox' ? input.checked : input.value;
      });

      fetch(apiOrigin + '/public/widgets/' + widget.id + '/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data, website: honeypot.value, idempotencyKey: uuid() }),
      })
        .then(function (r) {
          return r.json().then(function (body) { return { ok: r.ok, status: r.status, body: body }; });
        })
        .then(function (result) {
          if (result.ok) {
            statusEl.textContent = 'Thanks — we got it!';
            statusEl.style.color = '#2e9e5b';
            form.reset();
          } else {
            statusEl.textContent = (result.body && result.body.message) || 'Something went wrong.';
            statusEl.style.color = '#d64545';
            submitBtn.disabled = false;
          }
        })
        .catch(function () {
          statusEl.textContent = 'Network error — please try again.';
          statusEl.style.color = '#d64545';
          submitBtn.disabled = false;
        });
    });

    container.appendChild(form);
    document.body.appendChild(container);
  }
})();
