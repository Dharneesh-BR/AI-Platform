import {defineArrayMember, defineField, defineType} from 'sanity'

const capabilityOptions = [
  {title: 'RAG / Knowledge Retrieval', value: 'rag'},
  {title: 'Research', value: 'research'},
  {title: 'Analysis', value: 'analysis'},
  {title: 'Writing', value: 'writing'},
  {title: 'Calculation', value: 'calculation'},
  {title: 'Document Review', value: 'document'},
  {title: 'Planning', value: 'planning'},
]

const toolOptions = [
  {title: 'Vector Search', value: 'vector_search'},
  {title: 'Company Profile', value: 'company_profile'},
  {title: 'Readiness Report', value: 'readiness_report'},
  {title: 'Calculator', value: 'calculator'},
  {title: 'Document Lookup', value: 'document_lookup'},
  {title: 'Web Search', value: 'web_search'},
]

export const workforceAgent = defineType({
  name: 'workforceAgent',
  title: 'Workforce Agent',
  type: 'document',
  groups: [
    {name: 'profile', title: 'Profile', default: true},
    {name: 'runtime', title: 'Runtime'},
    {name: 'output', title: 'Output Format'},
    {name: 'governance', title: 'Governance'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Agent Name',
      type: 'string',
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Agent Slug',
      type: 'slug',
      group: 'profile',
      options: {source: 'name', maxLength: 64},
      validation: (rule) =>
        rule.required().custom((slug) => {
          if (!slug?.current) return 'Required'
          return /^[a-z0-9-]+$/.test(slug.current)
            ? true
            : 'Use lowercase letters, numbers, and hyphens only.'
        }),
    }),
    defineField({
      name: 'enabled',
      title: 'Status',
      type: 'string',
      group: 'profile',
      initialValue: 'enabled',
      options: {
        list: [
          {title: 'Enabled', value: 'enabled'},
          {title: 'Draft / Disabled', value: 'disabled'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'department',
      type: 'string',
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      group: 'profile',
      validation: (rule) => rule.max(300).warning('Keep this short for the agent picker.'),
    }),
    defineField({
      name: 'systemInstructions',
      title: 'System Instructions',
      type: 'text',
      rows: 8,
      group: 'runtime',
      validation: (rule) => rule.required().min(40),
    }),
    defineField({
      name: 'capabilities',
      type: 'array',
      group: 'runtime',
      of: [defineArrayMember({type: 'string'})],
      options: {list: capabilityOptions},
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'allowedSpecialists',
      title: 'Allowed Specialists',
      type: 'array',
      group: 'runtime',
      of: [defineArrayMember({type: 'string'})],
      options: {list: capabilityOptions},
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'allowedTools',
      title: 'Allowed Tools',
      type: 'array',
      group: 'runtime',
      of: [defineArrayMember({type: 'string'})],
      options: {list: toolOptions},
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'knowledgeScopes',
      title: 'Knowledge Scopes',
      type: 'array',
      group: 'runtime',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'responseFormatInstructions',
      title: 'Response Format Instructions',
      type: 'text',
      rows: 6,
      group: 'output',
      description: 'Describe exactly how this agent should structure its final answer.',
      validation: (rule) => rule.required().min(20),
    }),
    defineField({
      name: 'outputSections',
      title: 'Required Output Sections',
      type: 'array',
      group: 'output',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'heading',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'instructions',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'required',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              title: 'heading',
              subtitle: 'instructions',
            },
          },
        }),
      ],
      validation: (rule) => rule.min(1).warning('Add sections when the agent output must follow a fixed structure.'),
    }),
    defineField({
      name: 'modelPolicy',
      title: 'Model Policy',
      type: 'object',
      group: 'governance',
      fields: [
        defineField({
          name: 'defaultPolicy',
          type: 'string',
          initialValue: 'WRITING',
          options: {
            list: [
              {title: 'General', value: 'GENERAL'},
              {title: 'Reasoning', value: 'REASONING'},
              {title: 'Research', value: 'RESEARCH'},
              {title: 'Writing', value: 'WRITING'},
              {title: 'Verification', value: 'VERIFICATION'},
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'allowedRoles',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
          options: {
            list: [
              {title: 'Super Admin', value: 'SUPER_ADMIN'},
              {title: 'Admin', value: 'ADMIN'},
              {title: 'Consultant', value: 'CONSULTANT'},
              {title: 'Client', value: 'CLIENT'},
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'verificationPolicy',
      title: 'Verification Policy',
      type: 'object',
      group: 'governance',
      fields: [
        defineField({name: 'requiredForComplex', type: 'boolean', initialValue: true}),
        defineField({name: 'requiredForHighRisk', type: 'boolean', initialValue: false}),
        defineField({
          name: 'requiredPhrases',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'department',
    },
  },
})
