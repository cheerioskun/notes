#define _GNU_SOURCE
#include <dlfcn.h>
#include <elf.h>
#include <link.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
extern int scan(int);
#if !defined(__x86_64__)
#error This inspection experiment is specifically for x86-64 glibc ELF.
#endif
static uintptr_t *slot;
static int find_slot(struct dl_phdr_info *i, size_t n, void *data) {
    (void)n; (void)data;
    if (*i->dlpi_name) return 0;
    ElfW(Dyn) *dynamic = NULL;
    for (int p = 0; p < i->dlpi_phnum; ++p)
        if (i->dlpi_phdr[p].p_type == PT_DYNAMIC)
            dynamic = (void *)(i->dlpi_addr + i->dlpi_phdr[p].p_vaddr);
    ElfW(Rela) *rel = NULL;
    ElfW(Sym) *sym = NULL;
    const char *str = NULL;
    size_t bytes = 0;
    if (!dynamic) return 1;
    /* On this glibc target these pointer-valued dynamic entries are adjusted. */
    for (ElfW(Dyn) *d = dynamic; d->d_tag != DT_NULL; ++d) {
        if (d->d_tag == DT_JMPREL) rel = (void *)d->d_un.d_ptr;
        if (d->d_tag == DT_SYMTAB) sym = (void *)d->d_un.d_ptr;
        if (d->d_tag == DT_STRTAB) str = (void *)d->d_un.d_ptr;
        if (d->d_tag == DT_PLTRELSZ) bytes = d->d_un.d_val;
    }
    if (!rel || !sym || !str) return 1;
    for (size_t r = 0; r < bytes / sizeof *rel; ++r) {
        if (ELF64_R_TYPE(rel[r].r_info) == R_X86_64_JUMP_SLOT &&
            !strcmp(str + sym[ELF64_R_SYM(rel[r].r_info)].st_name, "scan")) {
            slot = (void *)(i->dlpi_addr + rel[r].r_offset);
            break;
        }
    }
    return 1;
}
int main(void) {
    dl_iterate_phdr(find_slot, NULL);
    if (!slot) { fputs("scan JUMP_SLOT not found\n", stderr); return 1; }
    uintptr_t before = *slot;
    dlerror();
    void *p = dlsym(RTLD_DEFAULT, "scan");
    const char *e = dlerror();
    if (e) { fprintf(stderr, "%s\n", e); return 1; }
    uintptr_t after_lookup = *slot;
    int result = scan(7);
    uintptr_t after_call = *slot;
    printf("slot address: %p\n", (void *)slot);
    printf("before:       %p\n", (void *)before);
    printf("dlsym result: %p\n", p);
    printf("after dlsym:  %p\n", (void *)after_lookup);
    printf("after call:   %p\n", (void *)after_call);
    printf("result: %d; lookup left slot unchanged: %s\n", result,
           before == after_lookup ? "yes" : "no");
    return 0;
}
