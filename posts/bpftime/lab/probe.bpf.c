#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

/* key 0: entries; key 1: normal returns. */
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 2);
    __type(key, __u32);
    __type(value, __u64);
} counts SEC(".maps");

static __always_inline int count(__u32 key)
{
    __u64 *value = bpf_map_lookup_elem(&counts, &key);
    if (value)
        __sync_fetch_and_add(value, 1);
    return 0;
}

SEC("uprobe")
int on_entry(void *ctx) { return count(0); }

SEC("uretprobe")
int on_return(void *ctx) { return count(1); }

char LICENSE[] SEC("license") = "GPL";
