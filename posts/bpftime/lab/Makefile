# Run on Linux. BPFTIME_SRC names the upstream source tree after its build.
BPFTIME_SRC ?= ../bpftime
BPFTIME_BUILD ?= $(BPFTIME_SRC)/build
CLANG ?= clang
CC ?= cc
INCLUDES = -I$(BPFTIME_BUILD)/libbpf
SYS_INCLUDES = -idirafter /usr/include/$(shell $(CC) -dumpmachine)

.PHONY: all clean
all: target probe.bpf.o loader

target: target.c
	$(CC) -O0 -g -fno-omit-frame-pointer -rdynamic -Wall -Wextra $< -o $@

probe.bpf.o: probe.bpf.c
	$(CLANG) -O2 -g -target bpf $(INCLUDES) $(SYS_INCLUDES) -c $< -o $@

loader: loader.c
	$(CC) -O2 -g -Wall -Wextra $(INCLUDES) $< $(BPFTIME_BUILD)/libbpf/libbpf.a -lelf -lz -o $@

clean:
	rm -f target probe.bpf.o loader
