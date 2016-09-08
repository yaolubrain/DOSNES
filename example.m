X = randn(1000, 10);
X = bsxfun(@minus, X, mean(X));
D = pdist2(X,X,'seuclidean');
P = exp(-D);

for i = 1:100
    P = bsxfun(@rdivide, P, sum(P,1));
    P = bsxfun(@rdivide, P, sum(P,2));
end    

Y = tsne_p_sphere(P);


Y = bsxfun(@rdivide, Y, sqrt(sum(Y.^2, 2)));

dosnes_data = [Y ones(length(Y),1) 5*ones(length(Y),1)];
csvwrite('data.csv', dosnes_data);
