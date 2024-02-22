const setup_pyodide = () => {
  // setup pyodide environment to run code blocks as needed
  var setup_code = `
import sys, io, traceback
namespace = {}  # use separate namespace to hide run_code, modules, etc.
def run_code(code):
  """run specified code and return stdout and stderr"""
  out = io.StringIO()
  oldout = sys.stdout
  olderr = sys.stderr
  sys.stdout = sys.stderr = out
  try:
      # change next line to exec(code, {}) if you want to clear vars each time
      exec(code, namespace)
  except:
      traceback.print_exc()

  sys.stdout = oldout
  sys.stderr = olderr
  return out.getvalue()
`;
  pyodide.runPython(setup_code);
};

const output = document.getElementById("output");
const inputs = [1, 2, 3];
const correct_outputs = [2, 3, 4];

const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: {
    name: "python",
    version: 3,
    singleLineStringErrors: false,
  },
  lineNumbers: true,
  indentUnit: 4,
  matchBrackets: true,
});

editor.setValue(`import numpy as np

def foo(bar):
    return np.array([[1,2,3],[1,2,3]])
`);
output.value = "Initializing...\n";

async function main() {
  let pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
  });
  await pyodide.loadPackage("numpy");
  pyodide.runPython(`import numpy as np`);
  // Pyodide ready
  output.value += "Ready!\n";
  return pyodide;
}

let pyodideReadyPromise = main();

function addToOutput(s) {
  output.value += ">>>" + s + "\n";
}

const testcode = `
a = np.array([[1,2,3],[1,2,3]])
b = foo(1)

print(a)
print(b)

def test_code():
  return np.array_equal(a, b)
  
test_code()`;

async function evaluatePython() {
  let pyodide = await pyodideReadyPromise;
  try {
    let code = editor.getValue();
    pyodide.runPython(code);
    const test = pyodide.runPython(testcode);
    addToOutput(test);
  } catch (err) {
    addToOutput(err);
  }
}
