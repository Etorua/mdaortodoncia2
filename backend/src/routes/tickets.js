import Router from 'koa-router';
import ticketController from '../controllers/ticketController.js';
import pdfController from '../controllers/pdfController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = new Router({ prefix: '/tickets' });

router.get('/public/appointments', ticketController.getPatientAppointments);
router.post('/public/appointments', ticketController.createPatientAppointment);

// Rutas protegidas
router.get('/', authenticateToken, ticketController.getAllTickets);
router.get('/deleted/history', authenticateToken, ticketController.getDeletedTickets);
router.get('/pdf/:id', authenticateToken, pdfController.generateTicketPdf); // Changed path to avoid conflict
router.get('/:id', authenticateToken, ticketController.getTicketById);
router.post('/', authenticateToken, ticketController.createTicket);
router.put('/:id', authenticateToken, ticketController.updateTicket);
router.delete('/:id', authenticateToken, ticketController.deleteTicket);

export default router;
