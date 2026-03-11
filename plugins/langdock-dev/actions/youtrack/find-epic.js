// name = YouTrack Find Epic
// description = Findet das passendste Epic-Ticket fuer einen Projektnamen und priorisiert aktive Projekttickets.
//
// project_name = Projektname, wie er im Epic-Titel steht (Required)
// limit = Maximale Anzahl Kandidaten zwischen 1 und 20 (default: 10)
// preferred_state = Bevorzugter Status fuer das beste Match (default: 'Projektticket')

const BASE_URL = 'https://fazit.youtrack.cloud/api';
const projectName = (data.input.projectName || data.input.project_name || '').toString().trim();
const limitRaw = Number(data.input.limit || 10);
const limit = Math.max(1, Math.min(20, Number.isFinite(limitRaw) ? limitRaw : 10));
const preferredState = (data.input.preferredState || data.input.preferred_state || 'Projektticket').toString().trim();

if (!projectName) {
  return {
    error: true,
    message: 'project_name ist erforderlich',
  };
}

function extractState(issue) {
  const fields = Array.isArray(issue.customFields) ? issue.customFields : [];
  for (const field of fields) {
    if (field && field.name === 'State' && field.value) {
      return field.value.name || field.value.fullName || field.value.login || String(field.value);
    }
  }
  return null;
}

function scoreIssue(issue) {
  const summary = (issue.summary || '').toString().trim().toLowerCase();
  const wanted = projectName.toLowerCase();
  const state = extractState(issue);
  let score = 0;

  if (summary === wanted) {
    score += 100;
  } else if (summary.includes(wanted)) {
    score += 60;
  }

  if (state === preferredState) {
    score += 20;
  }

  return score;
}

try {
  const query = `project: AI Type: Story "${projectName}"`;
  const fields = 'idReadable,summary,customFields(name,value(name,login,fullName))';
  const response = await ld.request({
    url: `${BASE_URL}/issues?query=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&$top=${limit}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${data.auth.apiKey}`,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return {
      error: true,
      status: response.status,
      message: `YouTrack API Fehler bei der Epic-Suche fuer ${projectName}`,
      details: response.text || null,
    };
  }

  const matches = (Array.isArray(response.json) ? response.json : [])
    .map((issue) => ({
      id: issue.idReadable || null,
      summary: issue.summary || '',
      state: extractState(issue),
      score: scoreIssue(issue),
    }))
    .sort((a, b) => b.score - a.score || a.summary.localeCompare(b.summary));

  return {
    projectName,
    epic: matches[0] || null,
    alternatives: matches.slice(1),
    count: matches.length,
    metadata: {
      source: 'YouTrack',
      timestamp: new Date().toISOString(),
    },
  };
} catch (error) {
  return {
    error: true,
    message: `Epic fuer ${projectName} konnte nicht gefunden werden`,
    details: error.message,
  };
}
