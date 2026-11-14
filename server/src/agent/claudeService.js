/**
 * Claude AI Financial Operations Copilot & Reasoning Service
 * Powered by Anthropic SDK with Function Calling / Tool Use.
 * 
 * Rules:
 * - Read-only access to state and policy logs.
 * - Claude CANNOT bypass the 5-Gate Policy Engine.
 * - Claude CANNOT sign or submit transactions directly to XRPL.
 */

const Anthropic = require('@anthropic-ai/sdk');
const {
  getProgrammes,
  getProgrammeById,
  getBeneficiaries,
  getBeneficiaryById,
  getSchedules,
  getAuditLogs,
  state
} = require('../data/store');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

let anthropicClient = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment. Please add it to your environment variables.');
    }
    anthropicClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// Define the read-only operational tools Claude can call
const COPILOT_TOOLS = [
  {
    name: 'get_programme_overview',
    description: 'Retrieves all funding programmes, active allocations, remaining budgets, and emergency pause statuses.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_pending_disbursements',
    description: 'Retrieves all student disbursement schedules currently awaiting payment or verification.',
    input_schema: {
      type: 'object',
      properties: {
        programmeId: {
          type: 'string',
          description: 'Optional filter for a specific programme (e.g. PRG-WTC-2026)'
        }
      },
      required: []
    }
  },
  {
    name: 'explain_policy_rejection',
    description: 'Retrieves audit logs and decodes why a student payout was blocked or rejected by the 5-Gate Policy Engine.',
    input_schema: {
      type: 'object',
      properties: {
        studentId: {
          type: 'string',
          description: 'The student identifier (e.g. STU-001 or STU-GHOST-999)'
        },
        scheduleId: {
          type: 'string',
          description: 'The disbursement schedule identifier (e.g. SCH-NOV-001)'
        }
      },
      required: []
    }
  },
  {
    name: 'get_student_allowance_details',
    description: 'Looks up a registered student beneficiary, their registered XRPL wallet address, monthly allowance cap, and KYC status.',
    input_schema: {
      type: 'object',
      properties: {
        studentId: {
          type: 'string',
          description: 'The student identifier (e.g. STU-001)'
        }
      },
      required: ['studentId']
    }
  }
];

// Execute the requested tool locally
async function executeTool(toolName, toolInput) {
  switch (toolName) {
    case 'get_programme_overview': {
      const programmes = getProgrammes();
      return programmes.map(p => ({
        id: p.id,
        name: p.name,
        totalBudgetXRP: p.totalBudget,
        remainingBudgetXRP: p.remainingBudget,
        isPaused: p.isPaused,
        beneficiaryCount: p.beneficiaries ? p.beneficiaries.length : 0
      }));
    }

    case 'get_pending_disbursements': {
      const schedules = getSchedules();
      let pending = schedules.filter(s => s.status === 'PENDING');
      if (toolInput.programmeId) {
        pending = pending.filter(s => s.programmeId === toolInput.programmeId);
      }
      return pending.map(s => ({
        scheduleId: s.scheduleId,
        studentId: s.studentId,
        amountXRP: s.amount,
        period: s.period,
        status: s.status
      }));
    }

    case 'explain_policy_rejection': {
      const logs = getAuditLogs();
      let relevant = logs.filter(l => l.decision === 'REJECTED' || l.approved === false);
      if (toolInput.studentId) {
        relevant = relevant.filter(l => l.studentId === toolInput.studentId);
      }
      if (toolInput.scheduleId) {
        relevant = relevant.filter(l => l.scheduleId === toolInput.scheduleId);
      }
      return relevant.map(l => ({
        timestamp: l.timestamp,
        decisionId: l.decisionId,
        studentId: l.studentId,
        scheduleId: l.scheduleId,
        reasonCode: l.reasonCode,
        message: l.message,
        failedGate: l.reasonCode === 'ERR_PROGRAMME_PAUSED' ? 'Gate 1 (Emergency Pause / Programme Active)'
                  : l.reasonCode === 'ERR_UNAUTHORIZED_BENEFICIARY' ? 'Gate 2 (Beneficiary Whitelist)'
                  : l.reasonCode === 'ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP' ? 'Gate 3 (Student Allowance Cap)'
                  : l.reasonCode === 'ERR_DUPLICATE_PAYMENT' ? 'Gate 4 (Replay / Duplicate Guard)'
                  : l.reasonCode === 'ERR_INSUFFICIENT_PROGRAMME_BUDGET' ? 'Gate 5 (Mandate Budget)'
                  : 'Policy Check'
      }));
    }

    case 'get_student_allowance_details': {
      const b = getBeneficiaryById(toolInput.studentId);
      if (!b) return { error: `Student ${toolInput.studentId} not found in registered records.` };
      return {
        studentId: b.studentId,
        fullName: b.fullName,
        institution: b.institution,
        monthlyAllowanceXRP: b.monthlyAllowance,
        walletAddress: b.walletAddress || 'Unregistered',
        status: b.status,
        programmeId: b.programmeId
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Handle a multi-turn user conversation with Claude Function Calling
 */
async function chatWithCopilot(messages) {
  const client = getAnthropicClient();

  const systemPrompt = `You are FundFlow's AI Financial Operations Copilot & Auditor Assistant for the W3Node 2026 Hackathon (Ripple Agentic Finance Track).

Your Role:
- You help Bursary CFOs, Auditors, and University Administrators understand funding schedules, XRPL disbursements, and policy engine decisions.
- You have read-only access to live FundFlow data through specialized tools.
- Real-World Case Study Context: Always reference how FundFlow's 5-Gate Zero-Trust Policy Engine prevents catastrophic errors like the 2017 Walter Sisulu University / NSFAS incident (where Sibongile Mani was sent R14 Million instead of R1,400 due to an un-gated middleman glitch). In FundFlow, this is blocked at Gate 3 with ERR_EXCEEDS_STUDENT_ALLOWANCE_CAP.

Safety and Integrity Rules:
- NEVER invent financial facts, balances, or transactions. If data is missing, use your tools to retrieve it.
- You CANNOT override policy rules, bypass allowance caps, or sign transactions.
- Keep your answers concise, clear, and professional. Format lists and currency with clear markdown.`;

  // Format messages into Anthropic structure
  let anthropicMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  // Initial call with tools
  let response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: COPILOT_TOOLS,
    messages: anthropicMessages
  });

  // Loop while Claude calls tools (up to 4 turns)
  let loopCount = 0;
  while (response.stop_reason === 'tool_use' && loopCount < 4) {
    loopCount++;
    const toolUseBlocks = response.content.filter(c => c.type === 'tool_use');
    if (!toolUseBlocks.length) break;

    // Add assistant's response to history
    anthropicMessages.push({
      role: 'assistant',
      content: response.content
    });

    // Execute each tool and collect results
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      console.log(`[Claude Copilot] Calling tool: ${toolUse.name} with:`, toolUse.input);
      const output = await executeTool(toolUse.name, toolUse.input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(output)
      });
    }

    // Pass tool results back to Claude
    anthropicMessages.push({
      role: 'user',
      content: toolResults
    });

    response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: COPILOT_TOOLS,
      messages: anthropicMessages
    });
  }

  // Extract final text output
  const replyText = response.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n');

  return {
    reply: replyText || 'I evaluated the records, but have no further comments.',
    model: response.model,
    usage: response.usage
  };
}

module.exports = {
  chatWithCopilot,
  COPILOT_TOOLS
};
