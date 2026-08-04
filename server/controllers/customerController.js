import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';

export async function getCustomers(req, res, next) {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerOrders(req, res, next) {
  try {
    const orders = await Order.find({ customer: req.params.id })
      .populate('cashier', 'name username')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function recordCustomerPayment(req, res, next) {
  try {
    const { amount, paymentMethod = 'cash', note = '' } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const newBalance = Math.max(0, (customer.receivableBalance || 0) - numAmount);
    customer.receivableBalance = newBalance;
    customer.paymentHistory.push({
      amount: numAmount,
      paymentMethod,
      note,
      recordedBy: req.user?._id,
      createdAt: new Date(),
    });

    await customer.save();
    res.json({ success: true, data: customer, message: `Payment of ${numAmount} recorded successfully!` });
  } catch (err) {
    next(err);
  }
}

