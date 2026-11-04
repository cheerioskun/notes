#include <errno.h>
#include <signal.h>
#include <stdbool.h>
#include <stdio.h>
#include <unistd.h>
#include <bpf/bpf.h>
#include <bpf/libbpf.h>

static volatile sig_atomic_t stop;
static void stop_now(int sig) { (void)sig; stop = 1; }

int main(int argc, char **argv)
{
    if (argc != 3) {
        fprintf(stderr, "usage: %s PROBE.bpf.o TARGET_BINARY\n", argv[0]);
        return 1;
    }
    signal(SIGINT, stop_now);
    signal(SIGTERM, stop_now);
    struct bpf_object *obj = bpf_object__open_file(argv[1], NULL);
    struct bpf_link *entry = NULL, *leave = NULL;
    int result = 1;
    if (!obj || libbpf_get_error(obj)) {
        fprintf(stderr, "cannot open BPF object\n");
        return 1;
    }
    if (bpf_object__load(obj)) {
        fprintf(stderr, "load failed; run this loader through bpftime load\n");
        goto out;
    }
    struct bpf_program *ep = bpf_object__find_program_by_name(obj, "on_entry");
    struct bpf_program *rp = bpf_object__find_program_by_name(obj, "on_return");
    if (!ep || !rp) { fprintf(stderr, "probe programs missing\n"); goto out; }
    struct bpf_uprobe_opts opts = { .sz = sizeof(opts), .func_name = "do_work" };
    entry = bpf_program__attach_uprobe_opts(ep, -1, argv[2], 0, &opts);
    if (libbpf_get_error(entry)) {
        entry = NULL; fprintf(stderr, "entry attach failed\n"); goto out;
    }
    opts.retprobe = true;
    leave = bpf_program__attach_uprobe_opts(rp, -1, argv[2], 0, &opts);
    if (libbpf_get_error(leave)) {
        leave = NULL; fprintf(stderr, "return attach failed\n"); goto out;
    }
    int fd = bpf_object__find_map_fd_by_name(obj, "counts");
    if (fd < 0) { fprintf(stderr, "counts map missing\n"); goto out; }
    puts("Registered do_work entry + return. Start target in terminal 2.");
    fflush(stdout);
    while (!stop) {
        __u32 k0 = 0, k1 = 1;
        __u64 n0 = 0, n1 = 0;
        if (bpf_map_lookup_elem(fd, &k0, &n0) || bpf_map_lookup_elem(fd, &k1, &n1)) {
            perror("map lookup"); goto out;
        }
        printf("entries=%llu returns=%llu\n",
               (unsigned long long)n0, (unsigned long long)n1);
        fflush(stdout);
        sleep(1);
    }
    result = 0;
out:
    bpf_link__destroy(leave);
    bpf_link__destroy(entry);
    bpf_object__close(obj);
    return result;
}
