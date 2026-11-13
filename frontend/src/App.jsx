import React, { useState } from 'react';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { Header } from './components/common/Header.jsx';
import { Footer } from './components/common/Footer.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { HotelDetailPage } from './pages/HotelDetailPage.jsx';
import { GuestForm } from './components/booking/GuestForm.jsx';
import { HoldReviewModal } from './components/booking/HoldReviewModal.jsx';
import { DemoPaymentModal } from './components/booking/DemoPaymentModal.jsx';
import { BookingConfirmation } from './components/booking/BookingConfirmation.jsx';
import { ManageBookingPage } from './pages/ManageBookingPage.jsx';

function MainApp() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [selectedDates, setSelectedDates] = useState({ checkIn: '', checkOut: '' });
  const [activeBookingContext, setActiveBookingContext] = useState(null);
  const [heldBooking, setHeldBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [manageParams, setManageParams] = useState({ reference: '', email: '' });

  const { showToast } = useToast();

  const handleNavigate = (view, hotelId = null) => {
    setCurrentView(view);
    if (hotelId) {
      setSelectedHotelId(hotelId);
    }
  };

  const handleSelectHotel = (hotelId, dates = {}) => {
    setSelectedHotelId(hotelId);
    setSelectedDates(dates);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToBooking = (hotel, context) => {
    setActiveBookingContext({ hotel, ...context });
    setCurrentView('guest-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHoldSuccess = (bookingResponse) => {
    setHeldBooking({
      ...bookingResponse,
      hotel: activeBookingContext?.hotel || null,
    });
    setCurrentView('hold-review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReleaseHold = () => {
    setHeldBooking(null);
    setCurrentView('landing');
    showToast('Reservation hold released.', 'info');
  };

  const handlePaymentSuccess = (confirmedData) => {
    setConfirmedBooking({
      ...confirmedData,
      hotel: heldBooking?.hotel || activeBookingContext?.hotel || null,
    });
    setHeldBooking(null);
    setCurrentView('booking-confirmed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {currentView === 'landing' && (
          <LandingPage
            onSelectHotel={handleSelectHotel}
            initialDates={selectedDates}
          />
        )}

        {currentView === 'detail' && (
          <HotelDetailPage
            hotelId={selectedHotelId}
            initialDates={selectedDates}
            onBack={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onProceedToBooking={handleProceedToBooking}
          />
        )}

        {currentView === 'guest-form' && activeBookingContext && (
          <GuestForm
            hotel={activeBookingContext.hotel}
            checkIn={activeBookingContext.checkIn}
            checkOut={activeBookingContext.checkOut}
            nights={activeBookingContext.nights}
            totalAmount={activeBookingContext.totalAmount}
            onHoldSuccess={handleHoldSuccess}
            onCancel={() => setCurrentView('detail')}
          />
        )}

        {currentView === 'hold-review' && heldBooking && (
          <HoldReviewModal
            booking={heldBooking}
            onProceedToPayment={() => {
              setCurrentView('demo-payment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReleaseHold={handleReleaseHold}
          />
        )}

        {currentView === 'demo-payment' && heldBooking && (
          <DemoPaymentModal
            booking={heldBooking}
            onPaymentSuccess={handlePaymentSuccess}
            onBackToHold={() => setCurrentView('hold-review')}
          />
        )}

        {currentView === 'booking-confirmed' && confirmedBooking && (
          <BookingConfirmation
            booking={confirmedBooking}
            onNavigateToManage={() => {
              setManageParams({
                reference: confirmedBooking.reference,
                email: confirmedBooking.guestEmail,
              });
              setCurrentView('manage-booking');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToExplore={() => {
              setConfirmedBooking(null);
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'manage-booking' && (
          <ManageBookingPage
            initialReference={manageParams.reference}
            initialEmail={manageParams.email}
            onExplore={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
