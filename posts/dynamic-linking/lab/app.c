#define _GNU_SOURCE
#include <dlfcn.h>
#include <link.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
extern int scan(int);
__attribute__((noinline)) static int local_scan(int x) {
    __asm__ volatile("" : "+r" (x));
    return x + 1;
}
static int objects(struct dl_phdr_info *i, size_t n, void *p) {
    (void)n; (void)p;
    printf("object bias=%p name=%s\n", (void *)i->dlpi_addr,
           *i->dlpi_name ? i->dlpi_name : "<main>");
    return 0;
}
static void *symbol(void *h, const char *name) {
    dlerror();
    void *p = dlsym(h, name);
    const char *e = dlerror();
    if (e) { fprintf(stderr, "%s\n", e); exit(1); }
    return p;
}
int main(int argc, char **argv) {
    volatile int input = 7;
    puts("calling scan twice, then local_scan");
    printf("scan(7)=%d\n", scan(input));
    printf("scan(7)=%d\n", scan(input));
    printf("local_scan(7)=%d\n", local_scan(input));
    int (*global)(int) = (int (*)(int))symbol(RTLD_DEFAULT, "scan");
    void *h = dlopen("libwork.so", RTLD_NOW | RTLD_LOCAL);
    if (!h) { fprintf(stderr, "%s\n", dlerror()); return 1; }
    int (*specific)(int) = (int (*)(int))symbol(h, "scan");
    Dl_info info;
    if (dladdr((void *)global, &info))
        printf("DEFAULT scan belongs to %s\n", info.dli_fname);
    if (dladdr((void *)specific, &info))
        printf("handle scan belongs to %s\n", info.dli_fname);
    printf("DEFAULT call=%d; handle call=%d\n", global(input), specific(input));
    dl_iterate_phdr(objects, NULL);
    puts("-- /proc/self/maps --");
    FILE *f = fopen("/proc/self/maps", "r");
    if (!f) { perror("maps"); return 1; }
    char line[1024];
    while (fgets(line, sizeof line, f)) fputs(line, stdout);
    fclose(f);
    if (argc > 1 && strcmp(argv[1], "--wait") == 0) {
        puts("Press Enter to exit (inspect this process first).");
        getchar();
    }
    /* No function pointer is used after this close. */
    dlclose(h);
    return 0;
}
