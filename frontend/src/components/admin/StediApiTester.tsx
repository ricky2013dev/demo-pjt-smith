import React, { useState, useCallback } from 'react';

// JSON Viewer Component with expand/collapse functionality
interface JsonNodeProps {
  data: unknown;
  keyName?: string;
  isLast?: boolean;
  depth?: number;
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
  path?: string;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  data,
  keyName,
  isLast = true,
  depth = 0,
  expandedPaths,
  togglePath,
  path = ''
}) => {
  const currentPath = keyName !== undefined ? `${path}.${keyName}` : path;
  const isExpanded = expandedPaths.has(currentPath);
  const indent = depth * 16;

  if (data === null) {
    return (
      <div style={{ marginLeft: indent }} className="flex">
        {keyName !== undefined && (
          <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
        <span className="text-orange-500">null</span>
        {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
      </div>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <div style={{ marginLeft: indent }} className="flex">
        {keyName !== undefined && (
          <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
        <span className="text-blue-600 dark:text-blue-400">{data.toString()}</span>
        {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
      </div>
    );
  }

  if (typeof data === 'number') {
    return (
      <div style={{ marginLeft: indent }} className="flex">
        {keyName !== undefined && (
          <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
        <span className="text-green-600 dark:text-green-400">{data}</span>
        {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
      </div>
    );
  }

  if (typeof data === 'string') {
    return (
      <div style={{ marginLeft: indent }} className="flex">
        {keyName !== undefined && (
          <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
        <span className="text-amber-600 dark:text-amber-400">"{data}"</span>
        {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div style={{ marginLeft: indent }} className="flex">
          {keyName !== undefined && (
            <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
          )}
          {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
          <span className="text-slate-600 dark:text-slate-400">[]</span>
          {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
        </div>
      );
    }

    return (
      <div>
        <div
          style={{ marginLeft: indent }}
          className="flex items-center cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
          onClick={() => togglePath(currentPath)}
        >
          <span className="material-symbols-outlined text-xs text-slate-500 mr-1 select-none">
            {isExpanded ? 'expand_more' : 'chevron_right'}
          </span>
          {keyName !== undefined && (
            <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
          )}
          {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
          <span className="text-slate-600 dark:text-slate-400">[</span>
          {!isExpanded && (
            <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">
              {data.length} {data.length === 1 ? 'item' : 'items'}
            </span>
          )}
          {!isExpanded && <span className="text-slate-600 dark:text-slate-400">]</span>}
          {!isExpanded && !isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
        </div>
        {isExpanded && (
          <>
            {data.map((item, index) => (
              <JsonNode
                key={index}
                data={item}
                isLast={index === data.length - 1}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
                path={`${currentPath}[${index}]`}
              />
            ))}
            <div style={{ marginLeft: indent }} className="flex">
              <span className="text-slate-600 dark:text-slate-400 ml-4">]</span>
              {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);

    if (entries.length === 0) {
      return (
        <div style={{ marginLeft: indent }} className="flex">
          {keyName !== undefined && (
            <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
          )}
          {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
          <span className="text-slate-600 dark:text-slate-400">{'{}'}</span>
          {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
        </div>
      );
    }

    return (
      <div>
        <div
          style={{ marginLeft: indent }}
          className="flex items-center cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded"
          onClick={() => togglePath(currentPath)}
        >
          <span className="material-symbols-outlined text-xs text-slate-500 mr-1 select-none">
            {isExpanded ? 'expand_more' : 'chevron_right'}
          </span>
          {keyName !== undefined && (
            <span className="text-purple-600 dark:text-purple-400">"{keyName}"</span>
          )}
          {keyName !== undefined && <span className="text-slate-600 dark:text-slate-400">: </span>}
          <span className="text-slate-600 dark:text-slate-400">{'{'}</span>
          {!isExpanded && (
            <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">
              {entries.length} {entries.length === 1 ? 'key' : 'keys'}
            </span>
          )}
          {!isExpanded && <span className="text-slate-600 dark:text-slate-400">{'}'}</span>}
          {!isExpanded && !isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
        </div>
        {isExpanded && (
          <>
            {entries.map(([key, value], index) => (
              <JsonNode
                key={key}
                data={value}
                keyName={key}
                isLast={index === entries.length - 1}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
                path={currentPath}
              />
            ))}
            <div style={{ marginLeft: indent }} className="flex">
              <span className="text-slate-600 dark:text-slate-400 ml-4">{'}'}</span>
              {!isLast && <span className="text-slate-600 dark:text-slate-400">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

interface JsonViewerProps {
  data: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['']));
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');

  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const getAllPaths = useCallback((obj: unknown, currentPath: string = ''): string[] => {
    const paths: string[] = [currentPath];

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        paths.push(...getAllPaths(item, `${currentPath}[${index}]`));
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
        paths.push(...getAllPaths(value, `${currentPath}.${key}`));
      });
    }

    return paths;
  }, []);

  const expandAll = useCallback(() => {
    try {
      const parsed = JSON.parse(data);
      const allPaths = getAllPaths(parsed);
      setExpandedPaths(new Set(allPaths));
    } catch {
      // Invalid JSON, ignore
    }
  }, [data, getAllPaths]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(['']));
  }, []);

  let parsedData: unknown;
  let parseError = false;

  try {
    parsedData = JSON.parse(data);
  } catch {
    parseError = true;
  }

  if (parseError) {
    return <pre className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{data}</pre>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'tree'
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Tree
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'raw'
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Raw
          </button>
        </div>
        {viewMode === 'tree' && (
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              title="Expand All"
            >
              <span className="material-symbols-outlined text-xs">unfold_more</span>
              Expand
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              title="Collapse All"
            >
              <span className="material-symbols-outlined text-xs">unfold_less</span>
              Collapse
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {viewMode === 'raw' ? (
          <pre className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{data}</pre>
        ) : (
          <JsonNode
            data={parsedData}
            expandedPaths={expandedPaths}
            togglePath={togglePath}
          />
        )}
      </div>
    </div>
  );
};



const DEFAULT_REQUEST_BODY ={
    "tradingPartnerServiceId": "62308",
    "provider": {
        "organizationName": "Cozi",
        "npi": "1235441221"
    },
    "subscriber": {
        "firstName": "YEONG",
        "lastName": "KIM",
        "memberId": "U8923222602"
    },
    "dependents": [
        {
            "firstName": "YEONG",
            "lastName": "KIM",
            "dateOfBirth": "19710625"
        }
    ],
    "encounter": {
        "serviceTypeCodes": ["35"]
    }
};

const DEFAULT_REQUEST_BODY_2={
    "tradingPartnerServiceId": "62308",
    "provider": {
        "organizationName": "Provider Name",
        "npi": "1999999984"
    },
    "subscriber": {
        "firstName": "John",
        "lastName": "Doe",
        "memberId": "CIGNAJTUxNm"
    },
    "dependents": [
        {
            "firstName": "Jordan",
            "lastName": "Doe",
            "dateOfBirth": "20150920"
        }
    ],
    "encounter": {
        "serviceTypeCodes": ["35"]
    }
};

const StediApiTester: React.FC = () => {
  const [requestBody, setRequestBody] = useState<string>(JSON.stringify(DEFAULT_REQUEST_BODY, null, 2));
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestTime, setRequestTime] = useState<number | null>(null);

  const handleCallApi = async () => {
    setIsLoading(true);
    setError(null);
    setResponse('');
    setRequestTime(null);

    const startTime = Date.now();

    // First validate the JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch {
      setRequestTime(Date.now() - startTime);
      setError('Invalid JSON format. Please check your request body.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/stedi/raw-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedBody),
      });

      setRequestTime(Date.now() - startTime);

      // Try to get response as text first
      const responseText = await res.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${data.error || 'Unknown error'}`);
        }
        setResponse(JSON.stringify(data, null, 2));
      } catch {
        // Response is not JSON, show as text
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${res.statusText}`);
        }
        setResponse(responseText);
      }
    } catch (err) {
      setRequestTime(Date.now() - startTime);
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRequestBody(JSON.stringify(DEFAULT_REQUEST_BODY, null, 2));
    setResponse('');
    setError(null);
    setRequestTime(null);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(requestBody);
      setRequestBody(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      setError('Cannot format: Invalid JSON');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">api</span>
              Stedi API Tester
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Info Banner */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Stedi Eligibility API Test</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Test the Stedi Healthcare Eligibility API directly. Modify the JSON request body below and click "Call API" to see the raw response.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-800 dark:bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-100 overflow-x-auto">
                    <div className="text-green-400 mb-1">// Endpoint & Headers</div>
                    <div><span className="text-yellow-300">POST</span> <span className="text-blue-300 text-[10px] break-all">https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3</span></div>
                    <div className="mt-1 text-slate-400">Authorization: <span className="text-orange-400">STEDI_API_KEY</span></div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 text-xs">
                    <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">Required Fields:</div>
                    <ul className="text-amber-700 dark:text-amber-300 space-y-0.5 text-[11px]">
                      <li>• provider.npi</li>
                      <li>• subscriber.memberId, dateOfBirth</li>
                      <li>• subscriber.address (address1, city, state)</li>
                      <li>• tradingPartnerServiceId (e.g., CIGNA)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-orange-500">upload</span>
                  Request Body
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFormatJson}
                    className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Format JSON"
                  >
                    <span className="material-symbols-outlined text-sm">format_align_left</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Reset to default"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full h-[500px] font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-900 dark:text-slate-100"
                  placeholder="Enter JSON request body..."
                  spellCheck={false}
                />
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleCallApi}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Calling API...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        Call Stedi API
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Response Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-green-500">download</span>
                  Response
                </h2>
                {requestTime !== null && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {requestTime}ms
                  </span>
                )}
              </div>
              <div className="p-4">
                {error && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">error</span>
                      <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                    </div>
                  </div>
                )}
                <div className="w-full h-[500px] font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 overflow-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                      Loading...
                    </div>
                  ) : response ? (
                    <JsonViewer data={response} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <span className="material-symbols-outlined mr-2">terminal</span>
                      Response will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StediApiTester;
