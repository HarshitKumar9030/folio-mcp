#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
const server = new McpServer({name:'folio',version:'0.2.0'});
const file = z.object({path:z.string(),content:z.string(),encoding:z.enum(['utf-8','base64']).default('utf-8')});
async function api(method,path,body){
 const token=process.env.FOLIO_API_TOKEN;
 if(!token)throw new Error('Set FOLIO_API_TOKEN to a token from Folioo Settings.');
 const base=(process.env.FOLIO_API_URL||'https://folioo.tech').replace(/\/$/,'');
 if(!/^https?:\/\//.test(base))throw new Error('FOLIO_API_URL must be an HTTP(S) URL.');
 const response=await fetch(base+'/api'+path,{method,headers:{Authorization:'Bearer '+token,Origin:process.env.FOLIO_ORIGIN||base,...(body instanceof FormData ? {} : {'Content-Type':'application/json'})},...(body?{body:body instanceof FormData ? body : JSON.stringify(body)}:{}),signal:AbortSignal.timeout(240000),redirect:'error'});
 if(!response.ok)throw new Error(`Folioo request failed (${response.status}). Check the server URL, token and permissions.`);
 const data=await response.json();return {content:[{type:'text',text:JSON.stringify(data)}]};
}
server.tool('list_projects','List your Folioo projects.',{},()=>api('GET','/projects'));
server.tool('list_deployments','List release history and current-release status.',{},()=>api('GET','/deployments'));
server.tool('read_project_files','Read files owned by your account.',{project_id:z.string()},({project_id})=>api('GET',`/projects/${encodeURIComponent(project_id)}/files`));
server.tool('publish_project','Publish supplied files to a new public URL.',{name:z.string(),files:z.array(file)},args=>api('POST','/projects',args));
server.tool('update_project','Publish changes with a version conflict check.',{project_id:z.string(),expected_version:z.number().int().positive(),files:z.array(file)},({project_id,...body})=>api('PUT',`/projects/${encodeURIComponent(project_id)}/files`,body));
const attachment = z.object({
  name: z.string().min(1).max(180),
  base64: z.string().max(11184812),
});
server.tool('run_workspace_task', 'Carry out an explicit Folioo task. Attach base64 files to upload or index, request a Studio output, or draft outreach for review.', {
  prompt: z.string().min(2).max(3000),
  files: z.array(attachment).max(10).optional(),
}, ({prompt, files}) => {
  if (!files?.length) return api('POST', '/studio/workspace-chat', {question: prompt});
  const form = new FormData();
  form.append('question', prompt);
  let total = 0;
  for (const file of files) {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64) || file.base64.length % 4)
      throw new Error('Attachment data must use standard base64.');
    const bytes = Buffer.from(file.base64, 'base64');
    total += bytes.length;
    if (!bytes.length || bytes.length > 8 * 1024 * 1024 || total > 29 * 1024 * 1024)
      throw new Error('Choose files up to 8 MB each and 29 MB total.');
    form.append('files', new Blob([bytes]), file.name);
  }
  return api('POST', '/studio/workspace-chat/files', form);
});
server.tool('save_contact', 'Save or update a lead or contact.', {
  name: z.string(), email: z.string().email(), company: z.string().optional(),
  kind: z.enum(['lead', 'contact']).optional(),
}, body => api('POST', '/outreach/contacts', body));
server.tool('list_outreach', 'List your contacts and email drafts for review.', {}, () => api('GET', '/outreach'));
server.tool('send_outreach_email', 'Deliver a reviewed draft only after the user explicitly approves sending it.', {
  draft_id: z.string(), confirmed: z.literal(true),
}, ({draft_id}) => api('POST', `/outreach/drafts/${encodeURIComponent(draft_id)}/send`));
// Proposals: list with status, read one, check activity, and create from a template or a brief.
server.tool('list_proposals', 'List proposals with their status: draft, published, opens, and who accepted for what total.', {}, () => api('GET', '/proposals'));
server.tool('get_proposal', 'Read one proposal: client, sections and blocks, pricing, acceptance and the published link.', {
  proposal_id: z.string(),
}, ({proposal_id}) => api('GET', `/proposals/${encodeURIComponent(proposal_id)}`));
server.tool('proposal_activity', 'Opens, section reading time, comments, acceptances and follow-up drafts for a proposal.', {
  proposal_id: z.string(),
}, ({proposal_id}) => api('GET', `/proposals/${encodeURIComponent(proposal_id)}/activity`));
server.tool('list_proposal_templates', 'List starter and saved proposal templates you can create from.', {}, () => api('GET', '/proposal-templates'));
server.tool('create_proposal_from_template', 'Create a ready-to-edit proposal from a template id (e.g. starter:website). No AI writing step.', {
  template_id: z.string().min(1).max(40), client: z.string().min(1).max(80), email: z.string().email().optional(),
}, body => api('POST', '/proposals/from-template', body));
server.tool('create_proposal_from_brief', 'Write a proposal page and deck from a client brief. Review and publish it in Folioo.', {
  client: z.string().min(1).max(80), brief: z.string().min(1).max(12000),
  email: z.string().email().optional(), tone: z.string().max(80).optional(),
}, async ({client, brief, email, tone}) => {
  const form = new FormData();
  form.append('client', client); form.append('brief', brief);
  if (email) form.append('email', email);
  if (tone) form.append('tone', tone);
  const saved = JSON.parse((await api('POST', '/proposals', form)).content[0].text);
  return api('POST', `/proposals/${encodeURIComponent(saved.id)}/generate`);
});
server.tool('billing_status', 'Show the plan, project slots, live projects and next charge. Workspace owners only.', {}, () => api('GET', '/billing/subscription'));
await server.connect(new StdioServerTransport());
