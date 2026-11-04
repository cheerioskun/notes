# The five-call bpftime lab

This lab accompanies [bpftime: three parts, one function call](https://notes-9fl.pages.dev/posts/bpftime/).

The target calls `do_work()` five times. BPF programs count entries and normal
returns in an array map. A separate libbpf loader registers both attachments and
prints the map. The target's source contains no BPF API calls.

## Environment

Ubuntu 24.04 Linux, ARM64 or x86-64; dynamically linked C target. Run both terminals
in the same Linux environment. This recipe deliberately builds only the CPU
function-hook components, with LLVM as the execution backend. It does not build
the syscall-transformer or GPU routes.

Upstream source snapshot: `25e250d651ad1d2a2608bbbaeaf7b9ee90cca401`.

## Build bpftime

```sh
sudo apt-get update
sudo apt-get install -y build-essential git cmake clang llvm llvm-dev pkg-config \
  libelf-dev zlib1g-dev libssl-dev libboost-all-dev binutils-dev \
  libyaml-cpp-dev ca-certificates curl unzip

mkdir bpftime-first-call
cd bpftime-first-call
git clone --filter=blob:none https://github.com/eunomia-bpf/bpftime.git
cd bpftime
git checkout 25e250d651ad1d2a2608bbbaeaf7b9ee90cca401
git submodule update --init --recursive

cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
  -DBPFTIME_LLVM_JIT=ON -DBPFTIME_UBPF_JIT=OFF \
  -DBPFTIME_BUILD_KERNEL_BPF=OFF -DBUILD_BPFTIME_DAEMON=OFF
cmake --build build --target bpftime-cli-cpp bpftime-agent \
  bpftime-syscall-server --parallel 2

mkdir -p "$HOME/.bpftime"
cp build/tools/cli/bpftime \
  build/runtime/agent/libbpftime-agent.so \
  build/runtime/syscall-server/libbpftime-syscall-server.so \
  "$HOME/.bpftime/"
export PATH="$HOME/.bpftime:$PATH"
bpftime --help
cd ..
```

Frida development archives are downloaded during the build. Network access to
GitHub release assets is required. Keep the source/build tree: the sample uses
its libbpf headers and static library.

## Build the sample

```sh
# From bpftime-first-call, beside the bpftime source checkout:
curl -fLO https://notes-9fl.pages.dev/posts/bpftime/lab.zip
unzip lab.zip
cd lab
make BPFTIME_SRC=../bpftime
./target
nm -n ./target | grep ' do_work$'
objdump -d --disassemble=do_work ./target
```

`./target` prints a PID and the results 1, 4, 7, 10, 13. The source split is:

- `target.c`: ordinary application and discoverable native function.
- `probe.bpf.c`: map and entry/return BPF programs.
- `loader.c`: libbpf loading, attachment registration, and map polling.
- `Makefile`: native target, native loader, and BPF object compilation.

## Terminal 1: load the extension

Run from `lab/` and leave it running:

```sh
export PATH="$HOME/.bpftime:$PATH"
export BPFTIME_VM_NAME=llvm
export BPFTIME_GLOBAL_SHM_NAME=bpftime_first_call
bpftime load ./loader ./probe.bpf.o "$(pwd)/target"
```

Wait for `Registered do_work entry + return` and initial zero counters.

## Terminal 2: start the target with its agent

Use the same Linux environment and `lab/` directory:

```sh
export PATH="$HOME/.bpftime:$PATH"
export BPFTIME_VM_NAME=llvm
export BPFTIME_GLOBAL_SHM_NAME=bpftime_first_call
bpftime start ./target
```

The target prints the same results as the plain run. Terminal 1 should eventually
show `entries=5 returns=5`. Intermediate snapshots need not match. Another target
run while the loader remains alive adds five to each count.

The loader passes `pid = -1`, requesting no specific PID. Participating targets
need an agent, the matching shared-memory namespace, and a resolvable function
attachment. The two counters aggregate all such participants; they are not
per-process or per-thread maps. The atomic increment protects concurrent updates.
Matching totals do not correlate individual calls or test argument handling.
This lab does not test PID-specific filtering.

After the target exits, press Ctrl-C in terminal 1. The loader closes its links
and object. This lab's target has already exited; this procedure makes no claim
about detaching hooks from a long-lived process.

## Change one thing

To count only entries, change `on_return` to `return 0;`, rebuild, stop the old
loader, then rerun both launches with a fresh shared-memory name in both
terminals. Expect `entries=5 returns=0`.

To instrument your own suitable C function, change the loader's `func_name`,
rebuild, and pass your binary path. Use a real non-inlined function and check
its symbol with `nm`. The example avoids architecture-specific argument reads;
adding those requires the appropriate register/context layout.

## Diagnose a failed milestone

- BPF compilation fails: check `clang --print-targets` for BPF support.
- Loader follows the kernel path: start it with `bpftime load`, not directly.
- Agent cannot find shared memory: start the loader first; match namespace,
  access permissions, and Linux/container IPC environment.
- Symbol/patch failure: check the binary path, function symbol, inlining,
  stripping, and the backend's error output.
- Target executes but counters stay zero: read `$HOME/.bpftime/runtime.log` for agent/program errors. Set
  `BPFTIME_LOG_OUTPUT=console` in terminal 1 before launching the loader for
  visible diagnostics. A mapped `.so` alone is insufficient evidence.
- Stale state: stop this lab's processes and use a new shared-memory name in
  both terminals. Do not remove another experiment's live shared memory.

`llvm-objdump -d probe.bpf.o` inspects BPF instructions. `objdump -d target`
inspects the executable on disk. For live patches, attach a debugger to a
longer-lived target, subject to host permissions, and disassemble its memory.

## Scope

This is a built-in-helper BPF extension, not deployment of a new native helper.
A custom native operation additionally needs an implementation in the target,
helper/ufunc registration, a defined ABI, and valid initialization and calling
context. See Part 2 for that boundary.

Five calls establish basic behavior. They do not measure hook overhead or prove
resource-management safety for exceptions, recursion, or managed runtimes.

## Validation

Verified November 4, 2026 on Ubuntu 24.04 ARM64 with Clang 18: the pinned
upstream LLVM build and the sample compiled; both CLI launches completed; the
plain target left both counters at zero; the hooked target preserved its five
results and reached `entries=5 returns=5`; Ctrl-C closed the loader with exit 0.
GDB also confirmed the live function-entry redirect.

The package-install command was checked against the build requirements, but a
fresh OS installation and x86-64 execution were not tested. The alternate uBPF
backend rejected this sample's atomic-add opcode during validation; use the
LLVM recipe above. This is a correctness exercise, not a performance result.
