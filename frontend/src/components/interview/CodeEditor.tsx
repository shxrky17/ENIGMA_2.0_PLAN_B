import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, AlertCircle, Sparkles, X } from 'lucide-react';
import api from '../../services/api';

interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
}

export interface JudgeResult {
  passed: boolean;
  passedCount: number;
  totalCount: number;
  results: TestCaseResult[];
  message: string;
}

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  questionText?: string;
  testCases: TestCase[];
  onSubmit: (code: string, result: JudgeResult) => void;
  onOptimize?: (optimizedCode: string, explanation: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  initialCode = 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}', 
  language = 'java',
  questionText = 'Solve the given coding problem.',
  testCases,
  onSubmit,
  onOptimize
}) => {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [activeTab, setActiveTab] = useState<'testcases' | 'results'>('testcases');
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);
  const [optimizedCode, setOptimizedCode] = useState('');
  const [optimizeExplanation, setOptimizeExplanation] = useState('');

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('results');
    try {
      const response = await api.post('/compiler/judge', {
        code,
        language,
        testCases
      });
      setJudgeResult(response.data);
    } catch (error) {
      console.error("Evaluation failed", error);
      const errMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
          : "Execution Engine Error: Could not connect to compiler service.";
      // Create a dummy failed result for network errors
      setJudgeResult({
        passed: false,
        passedCount: 0,
        totalCount: testCases.length,
        message: errMessage,
        results: testCases.map((tc, i) => ({
          index: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: "",
          passed: false,
          error: "Network/Server Error"
        }))
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    if (judgeResult) {
      onSubmit(code, judgeResult);
    } else {
      handleRunCode().then(() => {
        // Will submit after run if needed, but usually we require a run first
        alert("Please run your code first to see the results.");
      });
    }
  };

  const handleOptimize = async () => {
    if (!judgeResult || judgeResult.passed) return;
    setIsOptimizing(true);
    try {
      const failedCases = judgeResult.results.filter(r => !r.passed);
      const response = await fetch('http://localhost:8000/code/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          language,
          code,
          failed_cases: failedCases,
        }),
      });
      const data = await response.json();
      const newCode = (data.optimized_code || code) as string;
      const explanation = (data.explanation || 'No explanation returned.') as string;
      setOptimizedCode(newCode);
      setOptimizeExplanation(explanation);
      setOptimizeModalOpen(true);
      onOptimize?.(newCode, explanation);
    } catch (e) {
      console.error('Optimize failed', e);
      setOptimizedCode(code);
      setOptimizeExplanation('Failed to fetch optimized solution from LLM.');
      setOptimizeModalOpen(true);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#16181d] text-gray-300 rounded-none overflow-hidden border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] font-sans">
      {optimizeModalOpen && (
        <div className="absolute inset-0 z-20 bg-black/65 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-4xl max-h-[85vh] bg-[#101317] border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/40">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-[#171c24]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-300" />
                <h3 className="text-sm font-semibold text-gray-100">Optimized Solution</h3>
              </div>
              <button
                onClick={() => setOptimizeModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-4 border-r border-gray-800 overflow-auto max-h-[70vh]">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Explanation</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{optimizeExplanation}</p>
              </div>
              <div className="p-4 overflow-auto max-h-[70vh]">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Optimized Code</p>
                <pre className="text-xs leading-relaxed bg-[#0f1319] border border-gray-800 p-3 rounded-xl overflow-auto text-gray-200 whitespace-pre-wrap">
                  {optimizedCode}
                </pre>
                <div className="mt-3 flex gap-2 justify-end">
                  <button
                    onClick={() => setOptimizeModalOpen(false)}
                    className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setCode(optimizedCode);
                      setOptimizeModalOpen(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Use This Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Bar Navigation */}
      <div className="flex justify-between items-center px-4 py-2.5 bg-gradient-to-r from-[#20252e] to-[#1b2028] border-b border-gray-700/80">
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-[#313845] text-xs tracking-wide text-gray-100 rounded-lg border border-gray-600/80">
            {language}
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleRunCode}
            disabled={isRunning}
            className={`flex items-center space-x-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${isRunning ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600/60'}`}
          >
            {isRunning ? (
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full mr-2" />
            ) : (
              <Play size={16} className="text-green-400" />
            )}
            <span>Run Code</span>
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isRunning || !judgeResult}
            className={`flex items-center space-x-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!judgeResult || isRunning ? 'bg-green-900/50 text-green-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30'}`}
          >
            <Send size={16} />
            <span>Submit</span>
          </button>
          {judgeResult && !judgeResult.passed && (
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className={`flex items-center space-x-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isOptimizing
                  ? 'bg-indigo-900/40 text-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
              }`}
            >
              <Sparkles size={15} />
              <span>{isOptimizing ? 'Optimizing...' : 'Optimize'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-grow relative h-3/5 bg-[#1a1d24]">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            lineHeight: 25,
            padding: { top: 14 },
            fontFamily: 'Consolas, "Courier New", monospace',
            scrollBeyondLastLine: false,
            roundedSelection: false,
            scrollbar: {
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            }
          }}
        />
      </div>

      {/* Bottom Pane (Test Cases & Results) */}
      <div className="h-2/5 flex flex-col border-t border-gray-700 bg-[#15181e]">
        {/* Pane Tabs */}
        <div className="flex px-4 bg-[#1f232c] border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('testcases')}
            className={`px-4 py-2 text-sm font-medium border-t-2 ${activeTab === 'testcases' ? 'border-blue-500 text-white bg-[#1e1e1e]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            Test Cases
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-sm font-medium border-t-2 ${activeTab === 'results' ? 'border-blue-500 text-white bg-[#1e1e1e]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            Test Result
            {judgeResult && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${judgeResult.passed ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                {judgeResult.passedCount}/{judgeResult.totalCount}
              </span>
            )}
          </button>
        </div>

        {/* Pane Content */}
        <div className="flex-grow overflow-auto p-4 custom-scrollbar">
          
          {/* Test Cases View */}
          {activeTab === 'testcases' && (
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                {testCases.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestCaseIndex(idx)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTestCaseIndex === idx ? 'bg-[#3c3c3c] text-white' : 'hover:bg-[#2d2d2d] text-gray-400'}`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Input:</div>
                  <div className="font-mono text-sm bg-[#2d2d2d] p-3 rounded-md text-gray-300">
                    {testCases[activeTestCaseIndex]?.input || '(empty)'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Expected Output:</div>
                  <div className="font-mono text-sm bg-[#2d2d2d] p-3 rounded-md text-gray-300">
                    {testCases[activeTestCaseIndex]?.expectedOutput || '(empty)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results View */}
          {activeTab === 'results' && (
             judgeResult ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-lg font-bold ${judgeResult.passed ? 'text-green-500' : 'text-red-500'}`}>
                    {judgeResult.message}
                  </span>
                  {!judgeResult.passed && judgeResult.results[0]?.error && (judgeResult.results[0].error.includes("Network") || judgeResult.results[0].error.includes("Execution Error")) && (
                      <span className="text-red-400 text-sm italic ml-2">- Compilation/Server Engine Error</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  {judgeResult.results.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTestCaseIndex(idx)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTestCaseIndex === idx ? 'bg-[#3c3c3c] text-white' : 'hover:bg-[#2d2d2d] text-gray-400'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${res.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>Case {idx + 1}</span>
                    </button>
                  ))}
                </div>
                
                {judgeResult.results[activeTestCaseIndex] && (
                  <div className="space-y-4 pt-2">
                    {judgeResult.results[activeTestCaseIndex].error ? (
                        <div>
                        <div className="text-xs text-red-400 font-semibold mb-1 uppercase tracking-wider flex items-center">
                            <AlertCircle size={14} className="mr-1" />
                            Error:
                        </div>
                        <div className="font-mono text-sm bg-red-950/30 border border-red-900/50 p-3 rounded-md text-red-300 whitespace-pre-wrap">
                            {judgeResult.results[activeTestCaseIndex].error}
                        </div>
                        </div>
                    ) : (
                        <>
                            <div>
                            <div className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Input:</div>
                            <div className="font-mono text-sm bg-[#2d2d2d] p-3 rounded-md text-gray-300">
                                {judgeResult.results[activeTestCaseIndex].input || '(empty)'}
                            </div>
                            </div>
                            <div>
                            <div className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Output:</div>
                            <div className="font-mono text-sm bg-[#2d2d2d] p-3 rounded-md text-gray-300">
                                {judgeResult.results[activeTestCaseIndex].actualOutput || '(empty)'}
                            </div>
                            </div>
                            <div>
                            <div className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Expected:</div>
                            <div className="font-mono text-sm bg-[#2d2d2d] p-3 rounded-md text-gray-300">
                                {judgeResult.results[activeTestCaseIndex].expectedOutput || '(empty)'}
                            </div>
                            </div>
                        </>
                    )}
                  </div>
                )}
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 pt-8">
                    <div className="text-center">
                        <p>You must run your code first to see results.</p>
                        <p className="text-sm mt-1">Select "Run Code" from the top bar.</p>
                    </div>
                </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};



