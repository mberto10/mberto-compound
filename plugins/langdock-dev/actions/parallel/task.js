// name = Parallel Research Task
// description = Führt eine Recherche-Aufgabe mit Quellenangaben aus. Schnelle Antworten auf komplexe Fragen.

// query = Recherche-Frage oder Aufgabenbeschreibung (Required)
// output_format = Gewünschtes Ausgabeformat (optional, z.B. 'Eine Vergleichstabelle mit Vor- und Nachteilen')

const query = data.input.query;
const outputFormat = data.input.outputFormat || null;
const processor = 'base'; // Fixed to base for fast responses

if (!query) {
  return {
    error: true,
    message: 'query is required - describe your research question',
  };
}

// Build task spec if output format is provided
const taskSpec = outputFormat ? {
  output_schema: outputFormat,
} : undefined;

const requestBody = {
  input: query,
  processor: processor,
};

if (taskSpec) {
  requestBody.task_spec = taskSpec;
}

const options = {
  url: 'https://api.parallel.ai/v1/tasks/runs',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${data.auth.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: requestBody,
};

try {
  const response = await ld.request(options);

  if (response.status !== 200 && response.status !== 201) {
    return {
      error: true,
      message: `API returned status ${response.status}`,
      details: response.json,
    };
  }

  const taskData = response.json;

  // If we got a run_id, we need to poll for results
  const runId = taskData.run_id || taskData.id;

  if (runId && taskData.status !== 'completed') {
    // Poll for completion (max 50 seconds to stay within timeout)
    const maxAttempts = 25;
    const pollInterval = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await ld.request({
        url: `https://api.parallel.ai/v1/tasks/runs/${runId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.auth.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (statusResponse.status !== 200) {
        continue;
      }

      const statusData = statusResponse.json;

      if (statusData.status === 'completed') {
        // Fetch the result
        const resultResponse = await ld.request({
          url: `https://api.parallel.ai/v1/tasks/runs/${runId}/result`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.auth.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (resultResponse.status === 200) {
          return {
            taskId: runId,
            query: query,
            processor: processor,
            status: 'completed',
            result: resultResponse.json,
            timestamp: new Date().toISOString(),
          };
        }
      }

      if (statusData.status === 'failed') {
        return {
          error: true,
          taskId: runId,
          message: 'Task failed',
          details: statusData,
        };
      }
    }

    // Timeout - return partial info
    return {
      taskId: runId,
      query: query,
      processor: processor,
      status: 'processing',
      message: 'Task still processing. Use the taskId to check status later.',
      timestamp: new Date().toISOString(),
    };
  }

  // Synchronous response
  return {
    taskId: runId || null,
    query: query,
    processor: processor,
    status: 'completed',
    result: taskData.result || taskData,
    timestamp: new Date().toISOString(),
  };
} catch (error) {
  return {
    error: true,
    message: 'Task request failed',
    details: error.message,
  };
}
