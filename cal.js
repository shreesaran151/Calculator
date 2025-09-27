const displayEl = document.getElementById('display');
    const keysEl = document.getElementById('keys');

    // State
    let current = '0';           // shown value
    let stored = null;           // stored operand
    let pendingOp = null;        // pending operator
    let overwrite = true;        // next digit should overwrite

    // helper update
    const updateDisplay = () => displayEl.textContent = formatNumber(current);

    // format number: avoid exponential display for small reasonable numbers
    const formatNumber = (numStr) => {
      if (numStr === 'Error') return 'Error';
      if (numStr === '') return '0';
      // try to keep many decimals without trailing zeros
      if (numStr.includes('.')) {
        // remove unnecessary trailing zeros
        return parseFloat(numStr).toString();
      }
      return numStr;
    };

    // safely evaluate two operands with an operator
    const compute = (a, op, b) => {
      const x = parseFloat(a);
      const y = parseFloat(b);
      switch(op){
        case '+': return (x + y).toString();
        case '-': return (x - y).toString();
        case '*': return (x * y).toString();
        case '/': 
          if (y === 0) throw new Error("Divide by zero");
          return (x / y).toString();
        default: return b;
      }
    };

    // handle actions
    const handleKey = (target) => {
      const v = target.dataset.value;
      const action = target.dataset.action;

      try{
        if (action === 'clear') {
          current = '0';
          stored = null;
          pendingOp = null;
          overwrite = true;
        } else if (action === 'toggle-sign') {
          if (current !== '0') current = (parseFloat(current) * -1).toString();
        } else if (action === 'percent') {
          current = (parseFloat(current) / 100).toString();
        } else if (action === 'operator') {
          // if there's a pendingOp, compute it first
          if (pendingOp && !overwrite) {
            current = compute(stored, pendingOp, current);
            stored = current;
          } else {
            stored = current;
          }
          pendingOp = target.dataset.value; // like "+", "*", "/"
          overwrite = true;
        } else if (action === 'equals') {
          if (pendingOp && stored !== null) {
            current = compute(stored, pendingOp, current);
            stored = null;
            pendingOp = null;
            overwrite = true;
          }
        } else if (v !== undefined) {
          // input digit or dot
          if (overwrite) {
            // if dot pressed start "0."
            if (v === '.') {
              current = '0.';
              overwrite = false;
            } else {
              current = v;
              overwrite = false;
            }
          } else {
            // prevent multiple dots
            if (v === '.' && current.includes('.')) return;
            current = current + v;
          }
        }
      } catch(err){
        // handle errors (divide by zero etc.)
        console.error(err);
        current = 'Error';
        stored = null;
        pendingOp = null;
        overwrite = true;
      } finally {
        updateDisplay();
      }
    };

    // delegate click events to keys
    keysEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      handleKey(btn);
    });

    // keyboard support
    window.addEventListener('keydown', (e) => {
      // allow numbers, operators, Enter, Backspace, Escape, %
      if (/^[0-9]$/.test(e.key)) {
        const btn = [...keysEl.querySelectorAll('button')].find(b => b.dataset.value === e.key);
        if (btn) { handleKey(btn); e.preventDefault(); }
      } else if (e.key === '.') {
        const btn = keysEl.querySelector('button[data-value="."]');
        handleKey(btn);
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === '=') {
        const btn = keysEl.querySelector('button[data-action="equals"]');
        handleKey(btn);
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        // emulate a simple backspace
        if (!overwrite && current.length > 1) {
          current = current.slice(0, -1);
        } else {
          current = '0';
          overwrite = true;
        }
        updateDisplay();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        const btn = keysEl.querySelector('button[data-action="clear"]');
        handleKey(btn);
        e.preventDefault();
      } else if (['+','-','*','/'].includes(e.key)) {
        const btn = [...keysEl.querySelectorAll('button[data-action="operator"]')]
                    .find(b => b.dataset.value === e.key);
        if (btn) { handleKey(btn); e.preventDefault(); }
      } else if (e.key === '%') {
        const btn = keysEl.querySelector('button[data-action="percent"]');
        handleKey(btn);
        e.preventDefault();
      }
    });

    // initialize
    updateDisplay();
