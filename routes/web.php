<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommitteeController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\MemberPortalController;

// Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// Admin Portal Routes
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/', [CommitteeController::class, 'index'])->name('committees.index');
    Route::get('/committees/create', [CommitteeController::class, 'create'])->name('committees.create');
    Route::post('/committees/preview', [CommitteeController::class, 'preview'])->name('committees.preview');
    Route::post('/committees', [CommitteeController::class, 'store'])->name('committees.store');
    Route::get('/committees/{id}', [CommitteeController::class, 'show'])->name('committees.show');
    Route::get('/committees/{id}/edit', [CommitteeController::class, 'edit'])->name('committees.edit');
    Route::put('/committees/{id}', [CommitteeController::class, 'update'])->name('committees.update');
    Route::delete('/committees/{id}', [CommitteeController::class, 'destroy'])->name('committees.destroy');
    Route::post('/committees/{id}/date', [CommitteeController::class, 'updateStartDate'])->name('committees.updateDate');

    // Schedule winner, auction bid, member management & payout disbursement
    Route::post('/schedules/{scheduleId}/winner', [CommitteeController::class, 'updateWinner'])->name('schedules.updateWinner');
    Route::post('/schedules/{scheduleId}/date', [CommitteeController::class, 'updateScheduleDate'])->name('schedules.updateDate');
    Route::post('/schedules/{scheduleId}/payout', [CommitteeController::class, 'updatePayout'])->name('schedules.updatePayout');
    Route::post('/schedules/{scheduleId}/bid', [CommitteeController::class, 'updateAuctionBid'])->name('schedules.updateBid');
    Route::post('/schedules/{scheduleId}/lock-default', [CommitteeController::class, 'lockFormulaDefault'])->name('schedules.lockDefault');
    Route::post('/schedules/{scheduleId}/bid/reset', [CommitteeController::class, 'resetAuctionBid'])->name('schedules.resetBid');
    Route::post('/schedules/bids/{bidId}/approve', [CommitteeController::class, 'approveMemberBid'])->name('schedules.bids.approve');
    Route::post('/committees/{committeeId}/members', [CommitteeController::class, 'updateMembers'])->name('committees.updateMembers');

    // Members Management
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::post('/members', [MemberController::class, 'store'])->name('members.store');
    Route::put('/members/{id}', [MemberController::class, 'update'])->name('members.update');
    Route::delete('/members/{id}', [MemberController::class, 'destroy'])->name('members.destroy');

    // Member Payment tracking
    Route::get('/schedules/{scheduleId}/payments', [PaymentController::class, 'schedulePayments'])->name('payments.schedule');
    Route::post('/schedules/{scheduleId}/payments/mark-all-paid', [PaymentController::class, 'markAllPaid'])->name('schedules.payments.markAllPaid');
    Route::post('/payments/{paymentId}/toggle', [PaymentController::class, 'toggle'])->name('payments.toggle');
    Route::post('/payments/{paymentId}/penalty', [PaymentController::class, 'updatePenalty'])->name('payments.updatePenalty');

    // Export & Print
    Route::get('/committees/{id}/export/csv', [ExportController::class, 'exportCsv'])->name('committees.exportCsv');
    Route::get('/committees/{id}/print', [ExportController::class, 'printView'])->name('committees.printView');
});

// Member Portal Routes
Route::middleware(['auth', 'role:member'])->prefix('member')->as('member.')->group(function () {
    Route::get('/dashboard', [MemberPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/committees/{id}', [MemberPortalController::class, 'showCommittee'])->name('committees.show');
    Route::get('/committees/{id}/live-bids', [MemberPortalController::class, 'liveBids'])->name('committees.liveBids');
    Route::post('/schedules/{scheduleId}/bid', [MemberPortalController::class, 'submitBid'])->name('bids.submit');
});
