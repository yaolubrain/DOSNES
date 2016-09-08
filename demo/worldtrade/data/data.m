clear all
close all

load Y_dosnes_DSOM_worldtrade_pajek.mat
load DSOM_worldtrade_pajek.mat

d = sum(full(A),2);

Y = bsxfun(@minus, Y, mean(Y,1));
Y = bsxfun(@rdivide, Y, sqrt(sum(Y.^2, 2)));

data_ = [Y C 10*(d / max(d)).^(1/3)];
% data_ = [Y C 10*log(d)];

csvwrite('dosnes.csv', data_);

load Y_tsne_DSOM_worldtrade_pajek.mat
figure
scatter(Y(:,1),Y(:,2),'.')

load Y_tsne3d_DSOM_worldtrade_pajek.mat
figure
scatter3(Y(:,1),Y(:,2),Y(:,3),'.')
