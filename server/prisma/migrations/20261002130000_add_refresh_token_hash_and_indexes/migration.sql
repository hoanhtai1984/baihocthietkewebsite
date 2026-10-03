-- Lưu băm refresh token để thu hồi khi đăng xuất / xoay vòng token
ALTER TABLE "User" ADD COLUMN "refreshTokenHash" TEXT;

-- Chỉ mục cho các truy vấn thường dùng (lọc đơn theo user/trạng thái, đơn chi tiết, sản phẩm theo hãng)
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
CREATE INDEX "Product_hidden_createdAt_idx" ON "Product"("hidden", "createdAt");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
