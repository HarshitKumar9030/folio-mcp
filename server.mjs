#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
const server = new McpServer({name:'folio',version:'0.1.0'});
const file = z.object({path:z.string(),content:z.string(),encoding:z.enum(['utf-8','base64']).default('utf-8')});
async function api(method,path,body){
 const token=process.env.FOLIO_API_TOKEN;
 if(!token)throw new Error('Set FOLIO_API_TOKEN to a token from Folio Settings.');
 const base=(process.env.FOLIO_API_URL||'http://localhost:3000').replace(/\/$/,'');
 if(!/^https?:\/\//.test(base))throw new Error('FOLIO_API_URL must be an HTTP(S) URL.');
 const response=await fetch(base+'/api'+path,{method,headers:{Authorization:'Bearer '+token,Origin:process.env.FOLIO_ORIGIN||base,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000),redirect:'error'});
 if(!response.ok)throw new Error(`Folio request failed (${response.status}). Check the server URL, token and permissions.`);
 const data=await response.json();return {content:[{type:'text',text:JSON.stringify(data)}]};
}
server.tool('list_projects','List your Folio projects.',{},()=>api('GET','/projects'));
server.tool('list_deployments','List release history and current-release status.',{},()=>api('GET','/deployments'));
server.tool('read_project_files','Read files owned by your account.',{project_id:z.string()},({project_id})=>api('GET',`/projects/${encodeURIComponent(project_id)}/files`));
server.tool('publish_project','Publish supplied files to a new public URL.',{name:z.string(),files:z.array(file)},args=>api('POST','/projects',args));
server.tool('update_project','Publish changes with a version conflict check.',{project_id:z.string(),expected_version:z.number().int().positive(),files:z.array(file)},({project_id,...body})=>api('PUT',`/projects/${encodeURIComponent(project_id)}/files`,body));
await server.connect(new StdioServerTransport());
