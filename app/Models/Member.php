<?php

namespace App\Models;

use App\Traits\HasObfuscatedId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory, HasObfuscatedId;

    protected $fillable = ['name', 'phone', 'plain_password'];

    public function committees()
    {
        return $this->belongsToMany(Committee::class, 'committee_member')->withTimestamps();
    }

    public function payments()
    {
        return $this->hasMany(CommitteeMemberPayment::class);
    }

    public function user()
    {
        return $this->hasOne(User::class, 'member_id');
    }

    public function bids()
    {
        return $this->hasMany(MemberBid::class, 'member_id');
    }

    public function wonSchedules()
    {
        return $this->hasMany(CommitteeSchedule::class, 'member_id');
    }
}
