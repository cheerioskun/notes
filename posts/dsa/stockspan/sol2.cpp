#include<bits/stdc++.h>
#define vi vector<int>
#define pb(x) push_back(x)
using namespace std;


vi reign(vi& a){
  int N = a.size();  
  stack<int> stf, stb;
  stf.push(-1), stb.push(N);
  vi res(N);
  for(int i=0;i<N;++i){
    while(stf.top() != -1 && a[stf.top()] < a[i]) stf.pop();
    res[i] = (i-stf.top());
    stf.push(i);
  }
  for(int i=N-1;i>=0;--i){
    while(stb.top() != N && a[stb.top()] < a[i]) stb.pop();
    res[i] += (stb.top() - i) - 1;
    stb.push(i);
  }
  return res;
}

void printv(vi& a){
  for(int i=0;i<a.size();++i){
    cout<<a[i]<<" ";
  }
  cout<<endl;
}

int main(){
  int T, N;
  cin>>T;
  while(T--){
    cin>>N;
    vi a(N);
    for(int i = 0;i < N; ++i){
      cin>>a[i];
    }
    vi res = reign(a);
    printv(res);
  }
}
