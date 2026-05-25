#include<bits/stdc++.h>
#define vi vector<int>
#define pb(x) push_back(x)
using namespace std;


int main(){
  int N, x;
  cin>>N;
  vi a(N);
  stack<int> st;
  st.push(-1);
  for(int i=0;i<N;++i){
    cin>>a[i];
    while(st.top() != -1 && a[st.top()] <= a[i]) st.pop();
    cout<<i-st.top()<<endl;
    st.push(i);
  }
}
