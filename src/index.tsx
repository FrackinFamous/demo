import { Elysia, t } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { html } from '@elysiajs/html'
import { twind } from './twind'
import { db } from './db'
import { Todo, todos } from './db/schema'
import { eq } from 'drizzle-orm'

const app = new Elysia()
  .use(staticPlugin())
  .use(html())
  .use(twind)
  .get('/', ({ html }) =>
    html(
      <BaseHtml>
        <body
          class={'flex w-full h-screen justify-center items-center'}
          hx-get='/todos'
          hx-trigger='load'
          hx-swap='outerHTML'
        />
      </BaseHtml>
    )
  )

  .get('/todos', async () => {
    const data = await db.select().from(todos).all()
    return <TodoList todos={data} />
  })
  .post(
    '/todos/toggle/:id',
    async ({ params }) => {
      const oldTodo = await db.select().from(todos).where(eq(todos.id, params.id)).get()

      if (!oldTodo) {
        throw new Error('No matching todo found')
      }

      const newTodo = await db
        .update(todos)
        .set({ completed: !oldTodo.completed })
        .where(eq(todos.id, params.id))
        .returning()
        .get()

      if (!newTodo) {
        throw new Error('Failed to update todo')
      }

      return <TodoItem {...newTodo} />
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .delete(
    '/todos/:id',
    async ({ params }) => {
      await db.delete(todos).where(eq(todos.id, params.id)).run()
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .post(
    '/todos',
    async ({ body }) => {
      if (body.content.length === 0) {
        throw new Error('Content cannot be empty')
      }
      const newTodo = await db.insert(todos).values(body).returning().get()
      return <TodoItem {...newTodo} />
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )

  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

const BaseHtml = ({ children }: JSX.ElementChildrenAttribute) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <script type='module' src='public/htmx.min.js'></script>
        <script type='module' src='public/_hyperscript.min.js'></script>
        <link rel='stylesheet' type='text/css' href='public/main.css' />
        <title>Elysia Beth Stack</title>
      </head>
      ${children}
    </html>
  )
}

function TodoForm() {
  return (
    <form
      class='flex flex-row space-x-3'
      hx-post='/todos'
      hx-swap='afterend'
      _='on submit target.reset()'
    >
      <input type='text' name='content' class='border border-black px-3 py-1' />
      <button type='submit'>Add</button>
    </form>
  )
}

function TodoItem({ id, content, completed }: Todo) {
  return (
    <div class={'flex flex-row space-x-3 pl-3 py-1'}>
      <p>{content}</p>
      <input
        type='checkbox'
        checked={completed}
        hx-post={`/todos/toggle/${id}`}
        hx-target='closest div'
        hx-swap='outerHTML'
      />
      <button
        class={'text-red-500'}
        hx-delete={`/todos/${id}`}
        hx-swap='outerHTML'
        hx-target='closest div'
      >
        X
      </button>
    </div>
  )
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div>
      <TodoForm />
      {todos.map((todo) => (
        <TodoItem {...todo} />
      ))}
    </div>
  )
}