class Awaitable:
    def __await__(self):
        yield self          # this value travels up to the driver
        yield
        return 42            # this becomes the result of `await`

async def child():
    x = await Awaitable()
    return x + 1

async def parent():
    return await child()

# --- the manual driver ---
coro = parent()
i = 0
while i < 3: # At 1 we run this once, so we don't get 43. At 3 we do hit the exception
    i += 1
    try:
        yielded = coro.send(None)    # run until next yield
    except StopIteration as e:
        print(e.value)              # 43 — we're done

    # `yielded` is the value Awaitable yielded up the stack.
    # The real loop inspects it: is it a Future? schedule a callback.
    # Here we just resume immediately.
    print("got:", yielded)         # <Awaitable object>
