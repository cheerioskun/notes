CC = gcc
CFLAGS = -O2 -g -Wall -Wextra
all: app app-now app-noplt libagent.so
libwork.so: work.c
	$(CC) $(CFLAGS) -fPIC -shared -Wl,-soname,libwork.so -o $@ $<
app: app.c libwork.so
	$(CC) $(CFLAGS) -fPIE -pie -fplt -Wl,-z,lazy -Wl,-z,relro -o $@ app.c -L. -lwork -Wl,-rpath,'$$ORIGIN' -ldl
app-now: app.c libwork.so
	$(CC) $(CFLAGS) -fPIE -pie -fplt -Wl,-z,now -Wl,-z,relro -o $@ app.c -L. -lwork -Wl,-rpath,'$$ORIGIN' -ldl
app-noplt: app.c libwork.so
	$(CC) $(CFLAGS) -fPIE -pie -fno-plt -Wl,-z,now -Wl,-z,relro -o $@ app.c -L. -lwork -Wl,-rpath,'$$ORIGIN' -ldl
libagent.so: agent.c
	$(CC) $(CFLAGS) -fPIC -shared -o $@ $< -ldl -pthread
clean:
	rm -f app app-now app-noplt slots libwork.so libagent.so
.PHONY: all clean
# Optional inspection experiment, x86-64 glibc only.
slots: slots.c libwork.so
	$(CC) $(CFLAGS) -fPIE -pie -fplt -Wl,-z,lazy -o $@ $< -L. -lwork -Wl,-rpath,'$$ORIGIN' -ldl
