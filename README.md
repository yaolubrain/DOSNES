#Doubly Stochastic Neighbor Embedding on Spheres
DOSNES is a new method to visualize your data.

##Project Page
http://yaolubrain.github.io/dosnes/

##Paper
[Doubly Stochastic Neighbor Embedding on Spheres] (https://github.com/yaolubrain/DOSNES) <br>
Yao Lu\*, Zhirong Yang\*, Jukka Corander <br>
(*equal contribution)

##How to use?
Here is a simple example. 
``` 
% Generate data and its similarity matrix
X = randn(1000, 10);
D = pdist2(X,X);
P = exp(-D);

% Normalize it to be doubly stochastic by Sinkhorn-Knopp method
for i = 1:100
    P = bsxfun(@rdivide, sum(P,1));
    P = bsxfun(@rdivide, sum(P,2));
end    

% Run t-SNE with the spherical constraint.
Y = tsne_p_sphere(P);
``` 


