#include <stdio.h>
#include <unistd.h>

/* Keep a real, discoverable function entry for the first experiment. */
__attribute__((noinline)) int do_work(int x)
{
    volatile int y = x * 3;
    return y + 1;
}

int main(void)
{
    printf("target pid=%ld\n", (long)getpid());
    fflush(stdout);
    for (int i = 0; i < 5; i++) {
        printf("do_work(%d) = %d\n", i, do_work(i));
        fflush(stdout);
        sleep(1);
    }
    return 0;
}
