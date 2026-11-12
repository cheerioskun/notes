#define _GNU_SOURCE
#include <dlfcn.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
static int (*next_scan)(int);
static pthread_once_t once = PTHREAD_ONCE_INIT;
static void resolve(void) {
    dlerror();
    next_scan = (int (*)(int))dlsym(RTLD_NEXT, "scan");
    const char *e = dlerror();
    if (e || !next_scan) {
        fprintf(stderr, "scan lookup: %s\n", e ? e : "null function");
        abort();
    }
}
__attribute__((constructor)) static void start(void) {
    /* Demonstrates startup; not a safe template for hooking malloc. */
    fputs("agent constructor: before main\n", stderr);
}
int scan(int x) {
    pthread_once(&once, resolve);
    return next_scan(x) + 100;
}
