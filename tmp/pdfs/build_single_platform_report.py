from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/pdf/magnafic-ai-single-platform-alternatives.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
S = getSampleStyleSheet()
for name, size, lead, font, color in [
    ('TitleX',27,32,'Helvetica-Bold','#164A42'),
    ('Deck',11.5,16,'Helvetica','#54605A'),
    ('BodyX',10,14,'Helvetica','#202923'),
    ('SmallX',8,10.5,'Helvetica','#54605A'),
    ('CellX',8.5,11.5,'Helvetica','#202923'),
    ('HeadX',8.5,11.5,'Helvetica-Bold','#FFFFFF')]:
    S.add(ParagraphStyle(name=name,fontName=font,fontSize=size,leading=lead,textColor=colors.HexColor(color),spaceAfter=8))
S['Heading2'].textColor = colors.HexColor('#164A42')
S['Heading2'].spaceBefore = 12
S['Heading2'].spaceAfter = 8
flow=[]
def p(text,style='BodyX'): flow.append(Paragraph(text,S[style]))
def h(text): p(text,'Heading2')
def start(n,title,deck):
    p('MAGNAFIC AI  /  SINGLE-PROVIDER ALTERNATIVE  /  '+n,'SmallX')
    p(title,'TitleX')
    p(deck,'Deck')
def table(headers,rows,widths):
    data=[[Paragraph(x,S['HeadX']) for x in headers]]
    data += [[Paragraph(str(x),S['CellX']) for x in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#164A42')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#EFF5F2'),colors.white]),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    flow.extend([t,Spacer(1,8)])
def page(): flow.append(PageBreak())

start('01','One Cloud for the Entire App','Stakeholder option paper | 19 September 2026 | Version 2.0')
p('<b>Purpose.</b> Present a complete single-provider alternative to the previously proposed Netlify, Railway, Supabase and Firebase combination. The frontend is included in the alternative: retaining Netlify would no longer meet the single-provider requirement.')
p('<b>Primary alternative: AWS.</b> Host the web app, API, workers, database, cache, identity, storage and AI inference within AWS. Google Cloud and Microsoft Azure are also viable complete alternatives. All require deployment and integration work; none is a one-click move of the current system.')
table(['Decision factor','AWS','Google Cloud','Microsoft Azure'],[
    ['Entire app on one provider?','Yes, using Bedrock for AI','Yes, using Vertex AI for AI','Yes, using Azure-hosted Foundry models'],
    ['Strongest fit','Team seeking AWS infrastructure and service controls','Team building around Google services and existing Firebase knowledge','Team already using Microsoft cloud and identity'],
    ['Development hosting*','$100-250 / month','$90-250 / month','$100-280 / month'],
    ['Higher-traffic hosting*','$500-2,000 / month','$450-1,800 / month','$500-2,200 / month'],
    ['Migration effort','High: auth, storage, data and deployment','Medium-high: data, storage and deployment; assess identity continuity','High: auth, storage, data and deployment'],
    ['Key tradeoff','Several AWS services to configure and operate','Persistent data services still cost money when web traffic is idle','Service tiers, identity integration and model availability need validation']
],[113,128,129,129])
p('*Architecture-level planning allowances, not vendor quotations or validated capacity. Exclude AI inference, tax, engineering and contingency. Definitions and assumptions are on page 3. Cost ranges overlap and should not be treated as a price ranking.', 'SmallX')
h('What "single platform" means')
p('One cloud vendor for application runtime, data, authentication, storage and model access, with cloud charges consolidated through its billing system. It does not mean one server, one product or a fixed subscription. Select models served and billed through that cloud; calling an external model API would introduce another provider.')
p('This document replaces the earlier PDF for the stakeholder\'s alternatives discussion. It does not change the current project, authorize spending or initiate a migration. Final selection depends on team skills, target region, model suitability and a priced deployment design.', 'SmallX')
page()

start('02','Complete Service Mapping','Each column is a full alternative. No Netlify, Railway or Supabase account is required for these designs.')
table(['App capability','AWS alternative','Google Cloud alternative','Azure alternative'],[
    ['Next.js frontend','ECS on Fargate; CloudFront for delivery','Cloud Run; load balancer / Cloud CDN as needed','Container Apps; Front Door as needed'],
    ['NestJS API','ECS on Fargate','Cloud Run service','Container Apps'],
    ['Workers / LiteLLM','Separate ECS services or tasks','Cloud Run worker pools / jobs; gateway service','Container Apps with suitable worker scaling / jobs; gateway app'],
    ['Postgres + pgvector','RDS for PostgreSQL','Cloud SQL for PostgreSQL','Azure Database for PostgreSQL Flexible Server'],
    ['Redis / compatible cache','ElastiCache for Redis OSS or Valkey','Memorystore','Azure Managed Redis'],
    ['Customer authentication','Amazon Cognito','Identity Platform / Firebase Authentication under Google','Microsoft Entra External ID'],
    ['Private file storage','Amazon S3','Cloud Storage','Blob Storage'],
    ['AI model inference','Amazon Bedrock','Vertex AI','Microsoft Foundry models hosted and billed by Azure'],
    ['Secrets / diagnostics','Secrets Manager / CloudWatch','Secret Manager / Cloud Logging and Monitoring','Key Vault / Azure Monitor'],
    ['Container images','Amazon ECR','Artifact Registry','Azure Container Registry']
],[100,133,133,133])
p('Platform and model capabilities: sources [1-10]. Verify regional availability, quotas and pgvector versions before implementation. Redis-compatible engines must be tested against the application\'s queue library and persistence requirements.', 'SmallX')
h('AWS request flow')
p('Browser loads the frontend hosted on AWS and signs in through Cognito. The API checks user and organization access, reads RDS data and invokes Bedrock through the gateway. ElastiCache supports queued work; ECS workers process documents and write private files to S3.')
p('LiteLLM can remain a self-hosted gateway in the chosen cloud, subject to connector testing. Model access, permissions and request formats change. If the embedding model changes, existing document vectors must be regenerated and retrieval quality tested.', 'SmallX')
page()

start('03','Development & Growth Costs','USD per month, before tax. AI inference is charged separately even when it appears on the same cloud bill.')
p('<b>Development:</b> 5-20 active users, 1,000 AI interactions/month, 1 GB files and 10 GB outbound data. <b>Growth:</b> 10,000 active users, 300,000 interactions/month, 100 GB files and 1 TB outbound data. These are planning scenarios, not measured throughput commitments.')
p('Assume one region, small managed data services, containerized web/API/worker/gateway processes and ordinary text/document workloads. No GPU hosting, multi-region failover or enterprise support. Growth allows larger resources and replicas but does not promise high availability. Region, peak concurrency, database size and required recovery targets must be priced before approval.', 'SmallX')
table(['AWS hosting allocation','Development','Growth'],[
    ['Web, API, workers and gateway','$25-60','$150-500'],
    ['RDS database','$25-60','$100-450'],
    ['ElastiCache','$10-30','$50-200'],
    ['File storage / backup allowance','$5-15','$30-150'],
    ['Delivery, load balancer and network','$20-50','$100-450'],
    ['Logs, registry, secrets and identity allowance','$15-35','$70-250'],
    ['<b>Hosting subtotal</b>','<b>$100-250</b>','<b>$500-2,000</b>']
],[269,115,115])
p('These line items are budget allocations, not quoted service prices. The allowances must be replaced with a region-specific calculator estimate. Persistent managed database/cache services create a baseline cost even with few users. [1-3]', 'SmallX')
table(['Hosting + AI example','Development total','Growth total'],[
    ['AWS','$105-300','$2,000-17,000'],
    ['Google Cloud','$95-300','$1,950-16,800'],
    ['Microsoft Azure','$105-330','$2,000-17,200']
],[269,115,115])
p('<b>AI assumption:</b> $0.005-0.05 per completed interaction, giving $5-50/month in development and $1,500-15,000/month in growth. These hypothetical rates are sensitivity examples, not prices for a named model. Include all internal calls and retries; embeddings, OCR and other paid tools need separate allowances.', 'SmallX')
h('Proposed AWS pilot envelope')
p('Reserve <b>$375/month</b>: the $300 upper development example plus 25% contingency. This is a proposed allowance, not approved spend or a guaranteed cap. Enforce application usage limits and measure representative AI tasks before committing a growth budget. Exclude one-time migration labor, domain registration and optional paid tooling.')
page()

start('04','Decision & Implementation','Select the cloud first, then validate a priced pilot before committing to production.')
table(['Step','Outcome needed'],[
    ['1. Choose provider','AWS is the lead alternative. Prefer Google Cloud or Azure when existing skills, contracts or model requirements favor them. Confirm deployment region.'],
    ['2. Validate models and identity','Verify chat and embedding model quality, access and quotas. Plan identity migration and account mapping; do not assume existing passwords transfer.'],
    ['3. Build the cloud deployment','Containerize web/API/workers; configure networking, secrets, domain/TLS and service identities. Migrate Postgres and files with validation.'],
    ['4. Test the pilot','Test tenant access, streaming, uploads, vector search, queues and restores. Measure tokens, latency, concurrency and monthly run rate.'],
    ['5. Approve and release','Sponsor approves measured budget; technical owner signs off recovery and rollback. Switch traffic only after acceptance.']
],[112,387])
p('<b>Ownership:</b> sponsor selects budget and provider; engineering owns migration and operations; finance validates cloud billing and local-currency treatment. No deployment date or migration fee is committed. No external resources were created for this document.', 'SmallX')
h('Official references')
p('Reviewed 19 September 2026. Sources establish service capability and pricing methodology; workload estimates are independent planning judgments. Consult current calculators and account terms for a purchase decision.', 'SmallX')
refs=[
    ('1','AWS Fargate pricing','https://aws.amazon.com/fargate/pricing/'),
    ('2','Amazon RDS PostgreSQL pricing','https://aws.amazon.com/rds/postgresql/pricing/'),
    ('3','Amazon Cognito pricing','https://aws.amazon.com/cognito/pricing/'),
    ('4','Bedrock supported models and regions','https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html'),
    ('5','Cloud Run services and integrations','https://docs.cloud.google.com/run/docs/integrate/using-gcp-services'),
    ('6','Cloud Run pricing','https://cloud.google.com/run/pricing'),
    ('7','Cloud SQL vector search','https://docs.cloud.google.com/sql/docs/postgres/ai-overview'),
    ('8','Azure Container Apps pricing','https://azure.microsoft.com/en-us/pricing/details/container-apps/'),
    ('9','Azure Managed Redis pricing','https://azure.microsoft.com/en-us/pricing/details/managed-redis/'),
    ('10','Microsoft Foundry model hosting','https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview'),
    ('11','Entra External ID','https://learn.microsoft.com/en-us/entra/external-id/external-identities-overview'),
    ('12','Azure PostgreSQL pgvector','https://learn.microsoft.com/en-au/azure/postgresql/extensions/how-to-use-pgvector')]
for n,label,url in refs:
    p(f'[{n}] <link href="{url}" color="#176C60"><u>{label}</u></link>','SmallX')

def footer(c,doc):
    c.setStrokeColor(colors.HexColor('#BED0C8'))
    c.line(48,42,A4[0]-48,42)
    c.setFont('Helvetica',8)
    c.setFillColor(colors.HexColor('#52625A'))
    c.drawString(48,28,'Magnafic AI | Single-provider alternative | 19 Sep 2026')
    c.drawRightString(A4[0]-48,28,f'{doc.page} / 4')
doc=SimpleDocTemplate(str(OUT),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=42,bottomMargin=54,
    title='Magnafic AI - Single-Platform Hosting Alternatives',author='Magnafic AI',subject='AWS, Google Cloud and Azure stakeholder options')
doc.build(flow,onFirstPage=footer,onLaterPages=footer)
r=PdfReader(str(OUT))
assert len(r.pages)==4, f'Unexpected page count: {len(r.pages)}'
print(f'Created {OUT} | {len(r.pages)} pages')
