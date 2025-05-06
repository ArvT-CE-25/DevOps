// === THEME TOGGLE ===
window.addEventListener('load', () => {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.add(`${theme}-theme`);

  const icon = document.querySelector('#theme-toggle i');
  if (icon) {
    icon.classList.replace('fa-sun', theme === 'dark' ? 'fa-moon' : 'fa-sun');
  }

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-theme');
      const newTheme = isDark ? 'light' : 'dark';
      document.body.classList.toggle('dark-theme', newTheme === 'dark');
      document.body.classList.toggle('light-theme', newTheme === 'light');

      if (icon) {
        icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
      }

      localStorage.setItem('theme', newTheme);
    });
  }

  if (document.getElementById('history-list')) loadHistory();
  if (document.getElementById('historyChart')) updateChart();
});
let previousInput = '';
let previousOperation = '';
let previousResult = null;

function performOperation() {
  const operation = document.getElementById('operation').value;
  const input = document.getElementById('input').value.trim();
  const resultBox = document.getElementById('result');

  // If the input is empty, show an error
  if (!input) {
    resultBox.textContent = 'Please enter input values.';
    return; // Don't proceed further
  }

  // Check if the same operation and input are used as the last time
  if (input === previousInput && operation === previousOperation) {
    resultBox.textContent = `Result (cached): ${previousResult}`;
    return; // Skip calculation, use the cached result
  }

  // Parse the input numbers
  const numbers = input.split(',').map(num => parseFloat(num.trim()));
  if (numbers.some(isNaN)) {
    resultBox.textContent = 'Invalid input. Please enter valid numbers.';
    return; // Don't proceed further
  }

  let result;
  switch (operation) {
    case 'factorial': result = factorial(numbers[0]); break;
    case 'fibonacci': result = fibonacci(numbers[0]); break;
    case 'power': result = power(numbers); break;
    case 'sumArray': result = numbers.reduce((a, b) => a + b, 0); break;
    case 'gcd': result = numbers.reduce(gcd); break;
    case 'lcm': result = numbers.reduce(lcm); break;
    case 'prime': result = isPrime(numbers[0]); break;
    case 'average': result = numbers.reduce((a, b) => a + b, 0) / numbers.length; break;
    case 'minmax': result = `Min: ${Math.min(...numbers)}, Max: ${Math.max(...numbers)}`; break;
    case 'sqrt': result = numbers.map(n => `√${n} = ${Math.sqrt(n)}`).join(', '); break;
    default: result = 'Unknown operation'; break;
  }

  if (result === 'Unknown operation' || result === null || result === '') {
    resultBox.textContent = 'Unknown operation. Please select a valid operation.';
    return; // Don't save invalid results
  }

  // Only save if the result is valid (i.e., not NaN)
  if (!isNaN(result)) {
    resultBox.textContent = `Result: ${result}`;
    
    // Cache the result and inputs to prevent repeating the calculation
    previousInput = input;
    previousOperation = operation;
    previousResult = result;

    saveToHistory(operation, input, result);
    updateChart();
  } else {
    resultBox.textContent = 'Operation resulted in an invalid result.';
  }
}

function factorial(n) {
  if (n < 0) return 'Invalid input';
  let res = 1;
  for (let i = 1; i <= n; i++) res *= i;
  return res;
}

function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function isPrime(n) {
  if (n <= 1) return 'It is not prime';
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return 'It is not prime';
  }
  return 'It is prime';
}

function power(numbers) {
  if (numbers.length === 1) {
    return 'Invalid input, need Expo and base'; // Power should require two numbers
  }
  return Math.pow(numbers[0], numbers[1]);
}

// === HISTORY STORAGE ===
function saveToHistory(operation, input, result) {
  const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
  history.push({ operation, input, result, timestamp: new Date().toLocaleString() });
  localStorage.setItem('calcHistory', JSON.stringify(history));
}

function loadHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  const history = JSON.parse(localStorage.getItem('calcHistory')) || [];

  list.innerHTML = '';
  history.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.timestamp} - ${item.operation}(${item.input}) = ${item.result}`;
    list.appendChild(li);
  });
}

// === GRAPH CHART.JS ===
function updateChart() {
  const canvas = document.getElementById('historyChart');
  if (!canvas) return;

  const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
  const labels = history.map(h => h.timestamp);
  const data = history.map(h => parseFloat(h.result)).filter(n => !isNaN(n));

  const ctx = canvas.getContext('2d');
  if (window.historyChartInstance) window.historyChartInstance.destroy();

  window.historyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Results Over Time',
        data,
        borderColor: 'blue',
        backgroundColor: 'lightblue',
        tension: 0.3,
        fill: false
      }]
    }
  });
}

// === EXPORT PDF ===
function exportHistoryToPDF() {
  const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
  if (history.length === 0) {
    alert('No history to export');
    return;
  }

  const { jsPDF } = window.jspdf;  // Get jsPDF constructor from the library
  const doc = new jsPDF();

  // Set up a title for the PDF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Calculation History', 20, 20);

  // Add table headers
  doc.setFontSize(12);
  doc.text('Date', 20, 30);
  doc.text('Operation', 100, 30);
  doc.text('Input', 140, 30);
  doc.text('Result', 160, 30);

  // Set line height
  let lineHeight = 10;
  let y = 40;  // Initial position for data rows

  // Add rows from history
  history.forEach(item => {
    doc.text(item.timestamp, 20, y);  // Correct 'date' to 'timestamp'
    doc.text(item.operation, 100, y);
    doc.text(item.input, 140, y);
    doc.text(item.result.toString(), 160, y);
    y += lineHeight;

    // Add a new page if needed
    if (y > 250) {  // If the content exceeds the page length
      doc.addPage();
      y = 20;
    }
  });

  // Save the PDF
  doc.save('history.pdf');   alert(' history to export');
}

function exportGraphToPDF() {
  const { jsPDF } = window.jspdf;
  const canvas = document.getElementById('historyChart');
  if (!canvas) return;
  const doc = new jsPDF();
  const img = canvas.toDataURL('image/png');
  doc.addImage(img, 'PNG', 15, 30, 180, 100);
  doc.save('graph.pdf');
}
function clearHistory() {
localStorage.clear();
  localStorage.removeItem('calcHistory');
  alert('History cleared!');
  location.reload();  // Optionally, refresh the page to update the UI
}