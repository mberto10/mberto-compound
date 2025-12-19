# JF Example: RAG Pipeline Optimierung

## JF: RAG Pipeline - 19.12.2024

### Teilnehmer
- Max (Tech Lead)
- Sarah (Product)
- Tom (Engineering)

---

## Agenda

### 1. Status seit letztem JF (10 min)

**Erledigt:**
- ✅ Embedding Model auf German BERT umgestellt
- ✅ Chunking Strategy optimiert (512 → 256 tokens)
- ✅ Performance Tests abgeschlossen

**In Arbeit:**
- 🔄 A/B Test Setup (Tom) - 80% fertig
- 🔄 Feedback Loop Integration (Max)

**Metriken:**
| Metrik | Vorher | Jetzt | Ziel |
|--------|--------|-------|------|
| Retrieval Accuracy | 72% | 87% | 85% |
| P95 Latency | 3.2s | 1.8s | 2.0s |

### 2. Blocker & Risiken (10 min)

**Blocker:**
- ⚠️ Staging Environment Update ausstehend (INFRA-234)
  - Impact: A/B Test Launch verzögert
  - Maßnahme: DevOps Ticket eskaliert

**Risiken:**
- 🟡 Embedding Model Lizenzkosten höher als geplant
  - Impact: +2k€/Monat
  - Maßnahme: Alternative Open Source Modelle evaluieren

### 3. Entscheidungen (15 min)

**Zu entscheiden:**

1. **A/B Test Metriken**
   - Option A: Nur Click-Through Rate
   - Option B: CTR + User Satisfaction Score
   - **Empfehlung:** Option B für bessere Insights

2. **Rollout Strategie**
   - Option A: Big Bang (100% sofort)
   - Option B: Gradual (10% → 50% → 100%)
   - **Empfehlung:** Option B, 1 Woche pro Phase

### 4. Nächste Schritte (10 min)

| Wer | Was | Bis |
|-----|-----|-----|
| Tom | A/B Test finalisieren | 20.12. |
| Max | Feedback Loop PR mergen | 20.12. |
| Sarah | Stakeholder über Verzögerung informieren | 19.12. |
| All | A/B Test Launch | KW52 |

### 5. Diverses (5 min)

- Weihnachtsferien: 23.12. - 03.01. reduzierte Verfügbarkeit
- Nächster JF nach Ferien: 09.01.2025

---

**Nächster JF:** 09.01.2025, 10:00 Uhr
