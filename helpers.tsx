import { Elysia, t } from "elysia"; 

new Elysia()

.get(
    '/',
    () => {
  
      },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )

.post(
    '/',
    () => {
  
      },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )

  function TodoForm() {
    return (

    );
  }