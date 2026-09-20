from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf/magnafic-ai-single-vs-multi-platform-comparison.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
S=getSampleStyleSheet()
for name,size,lead,font,color in [
 ('TitleX',26,31,'Helvetica-Bold','#154B43'),('Deck',11,16,'Helvetica','#54605A'),
 ('BodyX',10,14,'Helvetica','#202923'),('SmallX',8,10.5,'Helvetica','#54605A'),
 ('CellX',8.6,11.5,'Helvetica','#202923'),('HeadX',8.6,11.5,'Helvetica-Bold','#FFFFFF')]:
 S.add(ParagraphStyle(name=name,fontName=font,fontSize=size,leading=lead,textColor=colors.HexColor(color),spaceAfter=8))
S['Heading2'].textColor=colors.HexColor('#154B43')
S['Heading2'].spaceBefore=11
S['Heading2'].spaceAfter=7
flow=[]
def p(text,style='BodyX'): flow.append(Paragraph(text,S[style]))
def h(text): p(text,'Heading2')
def start(n,title,deck):
 p('MAGNAFIC AI  /  HOSTING COMPARISON  /  '+n,'SmallX')
 p(title,'TitleX'); p(deck,'Deck')
def table(headers,rows,widths):
 data=[[Paragraph(x,S['HeadX']) for x in headers]]
 data += [[Paragraph(str(x),S['CellX']) for x in row] for row in rows]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([
 ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#154B43')),
 ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#EFF5F2'),colors.white]),
 ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),
 ('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
 flow.extend([t,Spacer(1,8)])
def page(): flow.append(PageBreak())

start('01','Single vs. Multiple Platforms','Stakeholder decision brief | 19 September 2026 | Version 3.1')
p('<b>Decision to make:</b> retain the proposed Netlify-based combination of specialist platforms, or host the entire application with one cloud vendor. This document compares both approaches using the same development and growth workloads. AWS is the detailed single-cloud example; Google Cloud and Azure are additional options.')
h('Option A: our multi-platform proposal')
p('Different providers operate different parts of the app. Netlify hosts the frontend; Railway runs the backend and background services; Supabase stores records and files; Firebase handles login. LiteLLM routes requests to the selected AI provider. This uses existing project integrations and the owner\'s Netlify experience.')
h('Option B: one cloud provider')
p('All runtime services, data, login, files and AI access sit within AWS. This consolidates cloud billing and infrastructure administration, but still involves several products and usage charges. It is not one server or one fixed-price package. A complete move also replaces Netlify for this app.')
table(['Capability','A: multi-platform','B: AWS single platform'],[
 ['Frontend','Netlify / Next.js','ECS Fargate / Next.js; CloudFront delivery'],
 ['API and workers','Railway / NestJS and workers','ECS services and tasks'],
 ['Database / vector search','Supabase Postgres + pgvector','RDS PostgreSQL + pgvector'],
 ['Queue and cache','Railway Redis','ElastiCache Redis OSS or compatible Valkey'],
 ['Authentication','Firebase Auth','Amazon Cognito'],
 ['File storage','Supabase Storage','Amazon S3'],
 ['AI gateway and inference','LiteLLM on Railway; external model API','LiteLLM on ECS; Amazon Bedrock models'],
 ['Secrets and diagnostics','Provider settings and logs','Secrets Manager and CloudWatch']
],[112,193,194])
p('AWS model selection must use models available and billed through Bedrock to preserve the single-provider approach. An external model API would add another vendor. Validate regional model availability and gateway compatibility.', 'SmallX')
p('Status: comparison proposal only. No deployment, migration or spending approval has occurred. This combined brief supersedes the earlier separate documents for the stakeholder discussion.', 'SmallX')
page()

start('02','Practical Tradeoffs','Neither vendor count nor traffic alone determines cost, reliability or operational simplicity.')
table(['Decision factor','A: multi-platform','B: AWS single platform'],[
 ['Initial implementation','Lower change burden: retains current service integrations. Production configuration and verification still required.','Higher change burden: new infrastructure, identity integration, database and file migration.'],
 ['Billing','Several invoices; shared Netlify costs must be allocated across projects.','One cloud billing system with separate service line items. AI remains metered.'],
 ['Daily operations','Convenient managed interfaces, but logs and settings are spread across vendors.','Centralized cloud controls; team configures networking, permissions, service sizing and monitoring.'],
 ['Data and network','Cross-provider connections may add latency and outbound charges.','Private networking is easier to coordinate; same-cloud traffic is not automatically free.'],
 ['Scaling','Each component can scale separately; provider limits must be monitored.','Fine-grained capacity and networking options; scaling still needs configuration and testing.'],
 ['Reliability','End-to-end app depends on several services. No automatic cross-cloud failover.','One vendor does not guarantee uptime. Redundancy, backups and recovery must be designed.'],
 ['Flexibility','Individual providers can be replaced, though API integrations still create switching work.','Container/Postgres logic is portable; cloud identity, storage and AI integrations increase switching effort.'],
 ['Team fit','Small team prioritizing development speed and current familiarity.','Team with cloud operations skills or a business requirement for a consolidated cloud.']
],[105,197,197])
h('Other complete single-provider options')
table(['Provider','Core services in that provider','Hosting / month*'],[
 ['Google Cloud','Cloud Run; Cloud SQL + pgvector; Memorystore; Google identity; Cloud Storage; Vertex AI.','Dev: $90-250<br/>Growth: $450-1,800'],
 ['Microsoft Azure','Container Apps; PostgreSQL; Managed Redis; Entra External ID; Blob Storage; Azure-hosted Foundry models.','Dev: $100-280<br/>Growth: $500-2,200']
],[90,275,134])
p('*Broad estimates, excluding AI and migration labor, under the workloads on pages 3-4. These overlapping ranges are not a price ranking. Select region, model and resource sizes before obtaining a firm estimate.', 'SmallX')
page()

start('03','Development Phase Costs','A few users: compare the cost of keeping a small test environment online.')
p('<b>Shared workload:</b> 5-20 monthly active users; 1,000 completed AI interactions/month; 1 GB uploaded files; 10 GB total outbound traffic. One environment and one primary region. This is development use, not a production availability commitment.')
table(['Monthly hosting allocation','A: multi-platform','B: AWS'],[
 ['Frontend, API, workers and LiteLLM','$15-60','$25-60'],
 ['PostgreSQL database','$0','$25-60'],
 ['Redis / compatible cache','$3-5','$10-30'],
 ['File storage and backup allowance','$0','$5-15'],
 ['Delivery, load balancer and network','Within allocations above','$20-50'],
 ['Identity, logs, registry and secrets','$0 within assumed limits','$15-35'],
 ['<b>Hosting subtotal</b>','<b>$18-65</b>','<b>$100-250</b>']
],[261,119,119])
p('Multi-platform compute allocation: Netlify $0-25, Railway API/workers $10-25 and gateway $5-10. Database and file costs assume free Supabase allowances. A paid database baseline adds at least $25/month for the assumed one-project setup. AWS uses small paid managed data services, so these options are not identical service tiers.', 'SmallX')
table(['AI assumption and resulting total','A: multi-platform','B: AWS'],[
 ['AI at $0.005 / interaction','$5','$5'],
 ['<b>Total with economical AI example</b>','<b>$23-70</b>','<b>$105-255</b>'],
 ['AI at $0.05 / interaction','$50','$50'],
 ['<b>Total with higher-cost AI example</b>','<b>$68-115</b>','<b>$150-300</b>'],
 ['Suggested pilot allowance*','$150 / month','$375 / month']
],[261,119,119])
p('*Rounded allowances include at least 25% contingency above each upper higher-cost example. They are proposals, not approved spend or automatic caps. AI rates are hypothetical average costs per completed interaction, not named-model prices; the same rates isolate hosting differences.', 'SmallX')
h('Development cost implication')
p('The proposed multi-platform setup has a lower cash baseline under these assumptions, helped by free allowances and current integrations. A complete AWS setup buys consolidated infrastructure at a higher baseline and adds implementation effort. Confirm the existing Netlify plan: spare shared credits can make incremental frontend cost low, but are not unlimited.')
page()

start('04','Higher-Traffic Phase Costs','Use the same workload on both sides; keep model spend separate from infrastructure.')
p('<b>Shared workload:</b> 10,000 monthly active users; 300,000 AI interactions/month; 100 GB files; 1 TB total outbound traffic. Users are not simultaneous. Peak concurrency, document sizes and processing time must be load-tested before selecting capacity.')
table(['Monthly hosting allocation','A: multi-platform','B: AWS'],[
 ['Frontend, API, workers and LiteLLM','$210-780','$150-500'],
 ['PostgreSQL / vector search','$75-300','$100-450'],
 ['Redis / compatible cache','$20-80','$50-200'],
 ['File storage / backup allowance','$0-100 incremental','$30-150'],
 ['Delivery, load balancer and network','Within allocations above','$100-450'],
 ['Identity, logs, registry and secrets','$0 within assumed limits','$70-250'],
 ['<b>Hosting subtotal</b>','<b>$305-1,260</b>','<b>$500-2,000</b>']
],[261,119,119])
p('Multi-platform compute: Netlify $40-200, Railway API/workers $150-500 and gateway $20-80. Traffic is split between frontend, API and direct storage downloads; this is not 1 TB per provider. Auth assumes email/social login, no SMS or enterprise identity. Storage is incremental to included Supabase allowances.', 'SmallX')
table(['Monthly hosting + AI','A: multi-platform','B: AWS'],[
 ['AI at $0.005 each: $1,500','<b>$1,805-2,760</b>','<b>$2,000-3,500</b>'],
 ['AI at $0.05 each: $15,000','<b>$15,305-16,260</b>','<b>$15,500-17,000</b>'],
 ['Illustrative allowance with economical AI*','$3,500','$4,400']
],[261,119,119])
p('*Rounded upward from the upper economical total plus 25% contingency. This allowance does not cover the higher-cost AI scenario. Model calls, retries and long document context can move spend far above it.', 'SmallX')
h('Growth cost implication')
p('Neither approach is automatically cheaper at scale. On these estimates, multi-platform hosting remains competitive; the ranges overlap. Single-cloud savings must be demonstrated through actual sizing and traffic measurements. Both designs can scale, and neither estimate includes multi-region failover or an enterprise availability guarantee.')
p('A tenfold change in average AI cost adds $13,500/month in this scenario, regardless of hosting approach. Measure completed-task cost, limit agent steps and set user quotas before expanding access. Migration should follow measured economics or business requirements, not a user-count threshold.', 'SmallX')
page()

start('05','Decision & Recommendation','Start with the current integrations; consolidate when there is a demonstrated business need.')
table(['Priority','More suitable starting point','Reason'],[
 ['Minimize development spend and change','Multi-platform proposal','Retains Netlify experience and current integrations; can use limited free allowances.'],
 ['Consolidate cloud administration and billing','AWS / single cloud','Unifies infrastructure ownership; accepts more setup and migration work.'],
 ['Prepare for higher traffic','Either, after load testing','Use measured concurrency, AI unit cost, data growth and recovery targets to size the design.']
],[140,145,214])
p('<b>Next decision:</b> agree the preferred operating model and pilot ceiling. For multi-platform, confirm Netlify shared capacity and staging configuration. For AWS, validate model availability, identity migration, database/file transfer and gateway connectors. Test backup recovery, tenant access, streaming and queued work before public release.')
h('Budget interpretation')
p('All figures are USD/month before tax and are planning allocations, not provider quotes. Exclude engineering/migration labor, domain registration, premium monitoring, paid support, SMS, separate staging and additional AI tools. Free credits and discounts are not assumed for AWS. Region and required redundancy can materially change costs.', 'SmallX')
p('Published anchors: Netlify offers current credit-based Free, Personal ($9) and Pro (from $20) plans; existing account terms may differ. Railway has $5 Hobby and $20 Pro usage minimums with included credits, not fees to add again above usage. Supabase Pro starts at $25 for the assumed single-project configuration.', 'SmallX')
p('AI examples are sensitivity calculations: interactions multiplied by hypothetical average cost. They do not imply equivalent models or provider rates. Validate model quality and total tokens per completed task; price embeddings, OCR, tools and other modalities separately.', 'SmallX')
h('Our final recommendation')
p('<b>Development and first launch: choose the multi-platform setup.</b> Use Netlify, Railway, Supabase and Firebase, with LiteLLM routing AI requests. It fits the current integrations, uses existing Netlify experience and has the lower estimated development cost. Start with the proposed $150/month pilot allowance, monitor actual spend and use a paid database plan before commercial launch.')
p('<b>Higher traffic: scale the same setup first.</b> Measure latency, concurrency, database growth and AI cost per completed task. The illustrated $3,500/month allowance only applies to the economical AI scenario. More users alone do not justify migration; evaluate total operating cost, including engineering time.')
p('<b>If one provider is a firm stakeholder requirement: choose AWS.</b> Proceed with the complete AWS design and a proposed $375/month development allowance. Confirm model access, migration effort and the team\'s ability to operate the cloud services before committing. Reassess consolidation when customer requirements, infrastructure controls or measured savings justify the change.')

def footer(c,doc):
 c.setStrokeColor(colors.HexColor('#BED0C8')); c.line(48,42,A4[0]-48,42)
 c.setFont('Helvetica',8); c.setFillColor(colors.HexColor('#52625A'))
 c.drawString(48,28,'Magnafic AI | Single vs. multi-platform | 19 Sep 2026')
 c.drawRightString(A4[0]-48,28,f'{doc.page} / 5')
doc=SimpleDocTemplate(str(OUT),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=42,bottomMargin=54,
 title='Magnafic AI - Single vs. Multi-Platform Hosting Comparison',author='Magnafic AI',subject='Stakeholder comparison of architecture and development/growth costs')
doc.build(flow,onFirstPage=footer,onLaterPages=footer)
r=PdfReader(str(OUT))
assert len(r.pages)==5,f'Unexpected page count: {len(r.pages)}'
assert all(len(pg.extract_text())>1000 for pg in r.pages)
text='\n'.join(pg.extract_text() for pg in r.pages)
assert 'References' not in text and 'Sources [' not in text and '[1-3]' not in text
assert 'Our final recommendation' in text
assert sum([15,0,3,0])==18 and sum([60,0,5,0])==65
assert sum([210,75,20,0])==305 and sum([780,300,80,100])==1260
assert sum([25,25,10,5,20,15])==100 and sum([60,60,30,15,50,35])==250
assert sum([150,100,50,30,100,70])==500 and sum([500,450,200,150,450,250])==2000
print(f'Created and checked: {OUT} | 5 pages')
