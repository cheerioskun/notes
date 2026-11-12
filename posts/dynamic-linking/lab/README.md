# Dynamic linking: one function from disk to execution

This lab accompanies [Before a function has an address](../index.html).

Requirements: Linux, GCC, binutils (`readelf`, `objdump`), make, and glibc.
The basic C examples should build on other Linux architectures, but the article's
assembly and the optional `slots` experiment are specifically x86-64/glibc.
No root access, network connection, or BPF runtime is needed.

## Build and observe

```sh
make
./app
LD_PRELOAD="$PWD/libagent.so" ./app
LD_PRELOAD="$PWD/libagent.so" ./app-now
LD_PRELOAD="$PWD/libagent.so" ./app-noplt
```

Without the preload, both imported `scan(7)` calls and `local_scan(7)` return 8.
With the preload, imported calls return 108 while the direct local call returns 8.
`RTLD_DEFAULT` finds the agent's definition; the explicit `libwork.so` handle
finds the original library's definition in this example.
The app prints each object's load bias, then its own `/proc/self/maps`.
ASLR makes addresses change across executions.

The agent constructor writes to stderr. The application writes to stdout;
redirecting or combining streams can change visible buffering order.

- `app`: PIE with PLT calls, lazy binding, partial RELRO.
- `app-now`: PIE with PLT calls, eager binding, full RELRO.
- `app-noplt`: PIE with GCC `-fno-plt`, eager binding, full RELRO.
- `libwork.so`: exports `scan(int)`.
- `libagent.so`: exports a wrapper, resolves `RTLD_NEXT` once with pthread_once.

This wrapper demonstrates lookup. It is not an allocator-hook bootstrap or
an implementation of cancellation-safe permit acquisition. Hooking functions
used by the loader or resolver itself needs a different initialization design.
The app's static local function includes an empty compiler barrier so GCC keeps
a visible direct call instead of folding away the demonstration.

## Inspect the ELF

```sh
readelf -hW app
readelf -lW app
readelf -dW app
readelf --dyn-syms -W app
readelf --dyn-syms -W libwork.so
readelf -rW app
objdump -d app
readelf -rW app-noplt
objdump -d app-noplt
LD_DEBUG=libs,bindings ./app
```

Find `scan@plt` and its `R_X86_64_JUMP_SLOT` in `app`; find a GOT-indirect
call and `R_X86_64_GLOB_DAT` in `app-noplt`. Find the direct `local_scan` call.
The exact offsets depend on your compiler, linker, architecture, and options.
`-L.` is the link-time search path. The Makefile records `$ORIGIN` as runtime
RUNPATH; the Makefile uses `$$` to pass the dollar sign through make.

## Watch lookup and binding separately (x86-64 glibc only)

```sh
make slots
./slots
LD_BIND_NOW=1 ./slots
LD_PRELOAD="$PWD/libagent.so" ./slots
```

`slots.c` uses program headers and the in-memory dynamic table to find the main
executable's `scan` JUMP_SLOT, then reads it before dlsym, after dlsym, and after
the imported call. On the tested lazy build, dlsym returns the implementation
address while the slot remains unresolved. The call subsequently binds it.
With LD_BIND_NOW, it is already resolved at the first observation.

This introspection program deliberately targets the tested x86-64/glibc format.
It assumes RELA PLT relocations and glibc-adjusted pointer-valued dynamic entries.
It is a single-threaded inspection experiment, not a portable loader parser or
concurrent patching implementation. It reads the GOT; it never modifies it.

## Inspect a live process

```sh
./app --wait
```

While it waits for Enter, inspect its PID in another terminal:

```sh
cat /proc/PID/maps
```

GDB examples (if installed):

```text
starti
info files
info sharedlibrary
info proc mappings
disassemble /r main
```

Calculate the current main-object load bias plus the relocation offset printed
by your `readelf -rW app`, then inspect that address with `x/gx`.
The application prints its load biases after the demonstration calls.
For first-call inspection, stop before the first `scan` call and use current
mappings/program headers to derive the bias.

## Extend one dimension

Add a function inside `libwork.so` which calls `scan`, rebuild, and inspect that
call. Compare with `-Wl,-Bsymbolic-functions`. Then try a call through a pointer
returned by an explicit-handle dlsym. Predict which routes interpose first.

## Reproducibility

The article was checked with GCC 14.2.0, GNU binutils 2.44, and glibc 2.41 on
x86-64 Linux. `observations.txt` records selected actual outputs with local path
prefixes removed. No timings are reported. ASLR addresses are from separate
runs where noted and must not be combined into one process model.

```sh
make clean
```
