import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Grid,
  Divider,
  Stack,
  Tooltip,
  Badge,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  AccessTimeRounded as TimeIcon,
  RestaurantRounded as KitchenIcon,
  LocalShippingOutlined as DeliveryIcon,
  PrintOutlined as PrintIcon,
  CheckCircleRounded as CheckIcon,
  CancelOutlined as RejectIcon,
  AddRounded as AddTimeIcon,
  NotificationsActiveRounded as BellIcon,
  StorefrontRounded as StoreIcon,
  PersonOutlineRounded as PersonIcon,
  PhoneOutlined as PhoneIcon,
  LocationOnOutlined as LocationIcon,
  TimerOutlined as TimerIcon,
  ArrowForwardRounded as ArrowForwardIcon,
} from '@mui/icons-material';
import { useColorMode } from '../theme/ThemeContext';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Calculate elapsed minutes since order creation
const getElapsedMins = (createdAt) => {
  if (!createdAt) return 0;
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / 60000));
};

export default function KitchenDisplayBoard({
  orders = [],
  onUpdateStatus,
  onCancelOrder,
  onRefresh,
}) {
  const { BRAND, isDark } = useColorMode();
  const [activeTimers, setActiveTimers] = useState({});
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Custom delay dialog
  const [delayDialog, setDelayDialog] = useState({ open: false, order: null, mins: 10 });

  // Categorize orders into KDS stages
  const newOrders = orders.filter((o) => {
    const s = String(o.status || '').toLowerCase();
    return s === 'placed' || s === 'new' || s === 'pending';
  });

  const preparingOrders = orders.filter((o) => {
    const s = String(o.status || '').toLowerCase();
    return s === 'confirmed' || s === 'processing' || s === 'preparing';
  });

  const readyOrders = orders.filter((o) => {
    const s = String(o.status || '').toLowerCase();
    return s === 'ready' || s === 'out for delivery' || s === 'out_for_delivery' || s === 'delivered';
  });

  // Print 80mm thermal receipt
  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    const vendorName = order.vendor?.name || 'AapnuBazaar Store';
    const orderId = order._id ? order._id.slice(-6).toUpperCase() : 'ORDER';
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('en-IN');
    const customerName = order.user?.name || 'Customer';
    const customerPhone = order.user?.mobile_number || order.address?.mobile_number || 'N/A';
    const addressStr = order.address?.address || order.address?.address_line_1 || 'Standard Delivery';

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px dashed #ccc;">
          <td style="padding: 6px 0; font-size: 13px; font-weight: bold;">${item.name || item.product?.name || 'Item'} x ${item.quantity}</td>
          <td style="padding: 6px 0; font-size: 13px; text-align: right;">₹${item.item_total || item.main_price * item.quantity || 0}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kitchen Receipt #${orderId}</title>
          <style>
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { margin: 10px; }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin: 0; font-size: 18px;">${vendorName}</h2>
            <p style="margin: 2px 0; font-size: 11px;">KITCHEN ORDER TICKET (KOT)</p>
            <h3 style="margin: 4px 0; font-size: 20px;">#${orderId}</h3>
            <p style="margin: 2px 0; font-size: 11px;">${dateStr}</p>
          </div>

          <div class="divider"></div>

          <div>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Customer:</strong> ${customerName}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Phone:</strong> ${customerPhone}</p>
            <p style="margin: 2px 0; font-size: 11px;"><strong>Address:</strong> ${addressStr}</p>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left; font-size: 12px;">ITEM</th>
                <th style="text-align: right; font-size: 12px;">AMT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <table>
            <tr>
              <td style="font-size: 12px;">Subtotal:</td>
              <td style="text-align: right; font-size: 12px;">₹${order.subtotal || 0}</td>
            </tr>
            <tr>
              <td style="font-size: 12px;">Packaging:</td>
              <td style="text-align: right; font-size: 12px;">₹${order.packaging_charge || 0}</td>
            </tr>
            <tr style="font-weight: bold; font-size: 14px;">
              <td style="padding-top: 4px;">TOTAL:</td>
              <td style="text-align: right; padding-top: 4px;">₹${order.total_payable_amount || 0}</td>
            </tr>
          </table>

          <div class="divider"></div>
          <p class="center" style="font-size: 11px; margin: 4px 0;">-- Thank You for Ordering --</p>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleAcceptOrder = async (order, prepMins = 20) => {
    setUpdatingOrderId(order._id);
    try {
      await onUpdateStatus(order, 'Preparing');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkReady = async (order) => {
    setUpdatingOrderId(order._id);
    try {
      await onUpdateStatus(order, 'Out for Delivery');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkDelivered = async (order) => {
    setUpdatingOrderId(order._id);
    try {
      await onUpdateStatus(order, 'Delivered');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Grid container spacing={2.5}>
        {/* ======================================================== */}
        {/* COLUMN 1: NEW ORDERS (TO ACCEPT) */}
        {/* ======================================================== */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              backgroundColor: isDark ? '#1E293B' : '#FFFBEB',
              border: `1.5px solid ${BRAND.amber}`,
              minHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Column Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={newOrders.length} color="warning">
                  <BellIcon sx={{ color: BRAND.amber, fontSize: 24 }} />
                </Badge>
                <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.text }}>
                  1. New Orders
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: BRAND.amber }}>
                NEEDS ACCEPTANCE
              </Typography>
            </Box>

            {/* Cards List */}
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
              {newOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                  <KitchenIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1 }} />
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>
                    No New Orders
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                    Incoming orders will chime and appear here
                  </Typography>
                </Box>
              ) : (
                newOrders.map((order) => {
                  const elapsed = getElapsedMins(order.createdAt);
                  const isUrgent = elapsed >= 5;
                  const isUpdating = updatingOrderId === order._id;

                  return (
                    <Card
                      key={order._id}
                      sx={{
                        borderRadius: '14px',
                        backgroundColor: BRAND.white,
                        border: `1.5px solid ${isUrgent ? BRAND.red : BRAND.border}`,
                        boxShadow: isUrgent
                          ? '0 0 0 2px rgba(224, 49, 49, 0.2), 0 8px 24px rgba(224, 49, 49, 0.12)'
                          : '0 4px 14px rgba(0,0,0,0.04)',
                        overflow: 'visible',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Order Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.text }}>
                              #{order._id?.slice(-6).toUpperCase()}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                              {order.user?.name || 'Customer'} {order.user?.mobile_number ? `• ${order.user.mobile_number}` : ''}
                            </Typography>
                          </Box>
                          <Chip
                            icon={<TimerIcon sx={{ fontSize: '13px !important' }} />}
                            label={`${elapsed}m ago`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '11px',
                              fontWeight: 800,
                              bgcolor: isUrgent ? BRAND.redLight : BRAND.amberLight,
                              color: isUrgent ? BRAND.red : BRAND.amber,
                            }}
                          />
                        </Box>

                        <Divider sx={{ my: 1.2, borderStyle: 'dashed' }} />

                        {/* Items List */}
                        <Stack spacing={0.8} sx={{ mb: 1.5 }}>
                          {(order.items || []).map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>
                                <span style={{ color: BRAND.green, marginRight: 6 }}>{item.quantity}x</span>
                                {item.name || item.product?.name || 'Dish'}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: BRAND.muted }}>
                                ₹{item.item_total || item.main_price * item.quantity}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>

                        {/* Total & Packaging */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, p: 1, bgcolor: BRAND.innerCard, borderRadius: '8px' }}>
                          <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                            Total Payable ({order.items?.length || 0} items):
                          </Typography>
                          <Typography sx={{ fontSize: '14px', fontWeight: 800, color: BRAND.green }}>
                            {formatCurrency(order.total_payable_amount)}
                          </Typography>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            fullWidth
                            disabled={isUpdating}
                            onClick={() => handleAcceptOrder(order, 20)}
                            sx={{
                              backgroundColor: BRAND.green,
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '12.5px',
                              textTransform: 'none',
                              borderRadius: '8px',
                              py: 0.8,
                              '&:hover': { backgroundColor: BRAND.darkGreen },
                            }}
                          >
                            {isUpdating ? <CircularProgress size={18} color="inherit" /> : 'Accept & Prep (20m)'}
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handlePrintReceipt(order)}
                            title="Print Slip"
                            sx={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', width: 36, height: 36 }}
                          >
                            <PrintIcon sx={{ fontSize: 18, color: BRAND.text }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => onCancelOrder && onCancelOrder(order)}
                            title="Reject"
                            sx={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', width: 36, height: 36, color: BRAND.red }}
                          >
                            <RejectIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* ======================================================== */}
        {/* COLUMN 2: IN KITCHEN (PREPARING) */}
        {/* ======================================================== */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              backgroundColor: isDark ? '#1E293B' : '#F5F3FF',
              border: `1.5px solid ${BRAND.purple || '#7C3AED'}`,
              minHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Column Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={preparingOrders.length} color="secondary">
                  <KitchenIcon sx={{ color: BRAND.purple || '#7C3AED', fontSize: 24 }} />
                </Badge>
                <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.text }}>
                  2. In Kitchen (Preparing)
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: BRAND.purple || '#7C3AED' }}>
                LIVE PREPARATION
              </Typography>
            </Box>

            {/* Cards List */}
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
              {preparingOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                  <KitchenIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1 }} />
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>
                    Kitchen is Idle
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                    Accepted orders being prepared will show here
                  </Typography>
                </Box>
              ) : (
                preparingOrders.map((order) => {
                  const elapsed = getElapsedMins(order.createdAt);
                  const isUpdating = updatingOrderId === order._id;

                  return (
                    <Card
                      key={order._id}
                      sx={{
                        borderRadius: '14px',
                        backgroundColor: BRAND.white,
                        border: `1px solid ${BRAND.border}`,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Order Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.text }}>
                              #{order._id?.slice(-6).toUpperCase()}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                              {order.user?.name || 'Customer'}
                            </Typography>
                          </Box>
                          <Chip
                            icon={<KitchenIcon sx={{ fontSize: '13px !important' }} />}
                            label={`Cooking (${elapsed}m)`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '11px',
                              fontWeight: 800,
                              bgcolor: isDark ? 'rgba(167, 139, 250, 0.2)' : '#EDE9FE',
                              color: isDark ? '#A78BFA' : '#7C3AED',
                            }}
                          />
                        </Box>

                        <Divider sx={{ my: 1.2, borderStyle: 'dashed' }} />

                        {/* Items Checklist */}
                        <Stack spacing={0.8} sx={{ mb: 1.5 }}>
                          {(order.items || []).map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>
                                <span style={{ color: BRAND.purple || '#7C3AED', marginRight: 6 }}>{item.quantity}x</span>
                                {item.name || item.product?.name || 'Dish'}
                              </Typography>
                              <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
                                Done
                              </Typography>
                            </Box>
                          ))}
                        </Stack>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            variant="contained"
                            fullWidth
                            disabled={isUpdating}
                            onClick={() => handleMarkReady(order)}
                            startIcon={<CheckIcon />}
                            sx={{
                              backgroundColor: BRAND.purple || '#7C3AED',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '12.5px',
                              textTransform: 'none',
                              borderRadius: '8px',
                              py: 0.8,
                              '&:hover': { backgroundColor: '#6D28D9' },
                            }}
                          >
                            {isUpdating ? <CircularProgress size={18} color="inherit" /> : 'Ready for Pickup'}
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handlePrintReceipt(order)}
                            title="Print Slip"
                            sx={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', width: 36, height: 36 }}
                          >
                            <PrintIcon sx={{ fontSize: 18, color: BRAND.text }} />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* ======================================================== */}
        {/* COLUMN 3: READY & OUT FOR DELIVERY */}
        {/* ======================================================== */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              backgroundColor: isDark ? '#1E293B' : '#ECFDF5',
              border: `1.5px solid ${BRAND.green}`,
              minHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Column Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={readyOrders.length} color="success">
                  <DeliveryIcon sx={{ color: BRAND.green, fontSize: 24 }} />
                </Badge>
                <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.text }}>
                  3. Ready / Dispatched
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: BRAND.green }}>
                OUT FOR DELIVERY
              </Typography>
            </Box>

            {/* Cards List */}
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
              {readyOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                  <DeliveryIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1 }} />
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>
                    No Orders Out
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                    Ready and dispatched orders will show here
                  </Typography>
                </Box>
              ) : (
                readyOrders.map((order) => {
                  const isDelivered = String(order.status || '').toLowerCase() === 'delivered';
                  const isUpdating = updatingOrderId === order._id;

                  return (
                    <Card
                      key={order._id}
                      sx={{
                        borderRadius: '14px',
                        backgroundColor: BRAND.white,
                        border: `1px solid ${BRAND.border}`,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                        opacity: isDelivered ? 0.75 : 1,
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Order Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.text }}>
                              #{order._id?.slice(-6).toUpperCase()}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                              {order.address?.address || 'Customer Address'}
                            </Typography>
                          </Box>
                          <Chip
                            label={isDelivered ? 'DELIVERED' : 'DISPATCHED'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '10px',
                              fontWeight: 800,
                              bgcolor: isDelivered ? BRAND.lightGreen : '#CFFAFE',
                              color: isDelivered ? BRAND.green : '#0E7490',
                            }}
                          />
                        </Box>

                        <Divider sx={{ my: 1.2, borderStyle: 'dashed' }} />

                        <Typography sx={{ fontSize: '12px', color: BRAND.muted, mb: 1.5 }}>
                          {order.items?.length || 0} items • {formatCurrency(order.total_payable_amount)}
                        </Typography>

                        {/* Action Buttons */}
                        {!isDelivered ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              fullWidth
                              disabled={isUpdating}
                              onClick={() => handleMarkDelivered(order)}
                              startIcon={<CheckIcon />}
                              sx={{
                                borderColor: BRAND.green,
                                color: BRAND.green,
                                fontWeight: 800,
                                fontSize: '12px',
                                textTransform: 'none',
                                borderRadius: '8px',
                                py: 0.6,
                                '&:hover': { backgroundColor: BRAND.lightGreen, borderColor: BRAND.green },
                              }}
                            >
                              {isUpdating ? <CircularProgress size={16} /> : 'Complete Delivery'}
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => handlePrintReceipt(order)}
                              title="Print Slip"
                              sx={{ border: `1px solid ${BRAND.border}`, borderRadius: '8px', width: 34, height: 34 }}
                            >
                              <PrintIcon sx={{ fontSize: 16, color: BRAND.text }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: BRAND.green }}>
                            <CheckIcon sx={{ fontSize: 16 }} />
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 700 }}>
                              Order Completed Successfully
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
