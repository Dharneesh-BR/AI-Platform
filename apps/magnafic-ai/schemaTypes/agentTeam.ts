import {defineArrayMember, defineField, defineType} from 'sanity'

const roleTypeOptions = [
  {title: 'Context / Knowledge', value: 'context'},
  {title: 'Research', value: 'research'},
  {title: 'Analysis', value: 'analysis'},
  {title: 'Ideation', value: 'ideation'},
  {title: 'Content Creation', value: 'content'},
  {title: 'Design Direction', value: 'design'},
  {title: 'Planning', value: 'planning'},
  {title: 'Calculation', value: 'calculation'},
  {title: 'Verification', value: 'verification'},
  {title: 'Final Output', value: 'final_output'},
]

export const agentTeam = defineType({
  name: 'agentTeam',
  title: 'Agent Team',
  type: 'document',
  groups: [
    {name: 'profile', title: 'Profile', default: true},
    {name: 'presentation', title: 'Presentation'},
    {name: 'members', title: 'Members'},
    {name: 'knowledge', title: 'Knowledge'},
    {name: 'workflow', title: 'Internal Workflow'},
  ],
  fields: [
    defineField({
      name: 'teamName',
      title: 'Team Name',
      type: 'string',
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'teamSlug',
      title: 'Team Slug',
      type: 'slug',
      group: 'profile',
      options: {source: 'teamName', maxLength: 64},
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
      name: 'primaryAgent',
      title: 'Primary Agent',
      type: 'reference',
      group: 'profile',
      to: [{type: 'workforceAgent'}],
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
      validation: (rule) => rule.max(300).warning('Keep this short for the workflow picker.'),
    }),
    defineField({
      name: 'teamImage',
      title: 'Team Image',
      type: 'image',
      group: 'presentation',
      description: 'Used for team cards, org charts, and workforce graphics.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.max(140),
        }),
      ],
    }),
    defineField({
      name: 'icon',
      title: 'Icon Key',
      type: 'string',
      group: 'presentation',
      description: 'Optional frontend icon key such as megaphone, palette, chart, scale, factory.',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      group: 'presentation',
      initialValue: 100,
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'supportedIntents',
      title: 'Supported Intents',
      type: 'array',
      group: 'profile',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'memberAgents',
      title: 'Member Agents',
      type: 'array',
      group: 'members',
      description: 'Agents that belong to this team and may be used by backend routing.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'workforceAgent'}],
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'routingInstructions',
      title: 'Routing Instructions',
      type: 'text',
      rows: 4,
      group: 'members',
      description: 'Plain-language rules for when this team should use each member agent.',
    }),
    defineField({
      name: 'knowledgeSources',
      title: 'Shared Team Knowledge Sources',
      type: 'array',
      group: 'knowledge',
      description: 'Files or source records shared by all agents in this team. Backend indexing should tag these with this team slug.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'scope',
              type: 'string',
              description: 'RAG scope key, for example MARKETING, SALES, LEGAL, HR, FINANCE, PRODUCTION.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'file',
              type: 'file',
              options: {
                accept: '.pdf,.doc,.docx,.txt,.md,.markdown,.csv,.xlsx,.ppt,.pptx',
              },
            }),
            defineField({
              name: 'notes',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'scope',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'internalRoles',
      title: 'Internal Roles',
      type: 'array',
      group: 'workflow',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'roleName',
              title: 'Role Name',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'roleSlug',
              title: 'Role Slug',
              type: 'slug',
              options: {source: 'roleName', maxLength: 64},
              validation: (rule) =>
                rule.required().custom((slug) => {
                  if (!slug?.current) return 'Required'
                  return /^[a-z0-9-]+$/.test(slug.current)
                    ? true
                    : 'Use lowercase letters, numbers, and hyphens only.'
                }),
            }),
            defineField({
              name: 'roleType',
              title: 'Role Type',
              type: 'string',
              options: {list: roleTypeOptions, layout: 'dropdown'},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              type: 'text',
              rows: 2,
              validation: (rule) => rule.max(220),
            }),
            defineField({
              name: 'instructions',
              type: 'text',
              rows: 4,
              validation: (rule) => rule.required().min(20),
            }),
            defineField({
              name: 'expectedOutput',
              title: 'Expected Output',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required().min(10),
            }),
            defineField({
              name: 'required',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'runCondition',
              title: 'Run Condition',
              type: 'text',
              rows: 2,
              description: 'Optional plain-language condition for when this role should run.',
            }),
            defineField({
              name: 'order',
              type: 'number',
              validation: (rule) => rule.required().integer().min(1),
            }),
          ],
          preview: {
            select: {
              title: 'roleName',
              subtitle: 'roleType',
            },
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'teamName',
      subtitle: 'department',
    },
  },
})
