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
      name: 'supportedIntents',
      title: 'Supported Intents',
      type: 'array',
      group: 'profile',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(1).unique(),
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
