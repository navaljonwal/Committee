@extends('layouts.app')

@section('title', 'Member Directory - ChitFund Pro')

@section('content')
<div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 sm:gap-3">
                <i class="fa-solid fa-users text-emerald-400"></i>
                <span>Member Directory</span>
            </h1>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">Manage committee participants, login credentials, contact details, and payment histories.</p>
        </div>
        <button onclick="document.getElementById('addMemberModal').classList.remove('hidden')" class="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <i class="fa-solid fa-user-plus"></i>
            <span>Add New Member</span>
        </button>
    </div>

    <!-- Members Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        @forelse($members as $m)
            <div class="glass-card p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all group">
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                            {{ strtoupper(substr($m->name, 0, 1)) }}
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">{{ $m->name }}</h3>
                            <span class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <i class="fa-solid fa-phone text-[10px] text-emerald-400"></i>
                                <span>{{ $m->phone ?? 'No phone provided' }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Member Credentials Badge -->
                <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div class="flex items-center justify-between text-[11px]">
                        <span class="text-slate-400 flex items-center gap-1">
                            <i class="fa-solid fa-key text-amber-400 text-[10px]"></i> Member Portal Login:
                        </span>
                        <span class="font-mono text-emerald-300 font-semibold">{{ $m->phone ?? 'Set Phone' }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 flex justify-between items-center">
                        <span class="flex items-center gap-1">
                            <span>Password:</span>
                            <code class="text-amber-300 font-mono font-bold">{{ $m->plain_password ?? 'member123' }}</code>
                        </span>
                        <span class="text-emerald-400 font-semibold"><i class="fa-solid fa-shield-halved mr-0.5"></i>Portal Ready</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                        <span class="text-slate-400 text-[10px] uppercase font-bold block">Committees</span>
                        <span class="text-white font-extrabold text-sm">{{ $m->committees_count }}</span>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                        <span class="text-slate-400 text-[10px] uppercase font-bold block">Draws Won</span>
                        <span class="text-amber-400 font-extrabold text-sm">{{ $m->won_schedules_count }}</span>
                    </div>
                </div>

                <div class="pt-2 flex items-center justify-between border-t border-slate-800/60">
                    @if($m->phone)
                        @php
                            $passStr = $m->plain_password ?? 'member123';
                            $waMsg = "Hello " . $m->name . ", your Member Portal login details: Phone: " . $m->phone . ", Password: " . $passStr . ". Link: " . route('login');
                        @endphp
                        <a href="https://wa.me/91{{ preg_replace('/[^0-9]/', '', $m->phone) }}?text={{ urlencode($waMsg) }}" target="_blank" class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                            <i class="fa-brands fa-whatsapp text-sm"></i> Share Login Info
                        </a>
                    @else
                        <span></span>
                    @endif

                    <div class="flex items-center space-x-2">
                        <button type="button" onclick="openEditMemberModal('{{ $m->hash_id }}', '{{ addslashes($m->name) }}', '{{ $m->phone }}', '{{ addslashes($m->plain_password ?? 'member123') }}')" class="text-xs text-blue-400 hover:text-blue-300 font-semibold p-1 flex items-center gap-1">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>

                        <form action="{{ route('members.destroy', $m) }}" method="POST" data-ajax="true" data-confirm="Are you sure you want to delete member &quot;{{ addslashes($m->name) }}&quot;? They will be removed from member records." data-confirm-title="Delete Member Confirmation" data-confirm-btn="Yes, Delete Member">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-xs text-rose-400 hover:text-rose-300 font-semibold p-1 flex items-center gap-1">
                                <i class="fa-solid fa-trash-can"></i> Delete
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        @empty
            <div class="col-span-full glass-card p-12 rounded-2xl text-center space-y-4 border border-dashed border-slate-800">
                <div class="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                    <i class="fa-solid fa-users-slash"></i>
                </div>
                <h3 class="text-base font-bold text-white">No Members Added Yet</h3>
                <p class="text-xs text-slate-400 max-w-sm mx-auto">Add members to easily track monthly installment payments and draw winners.</p>
                <button onclick="document.getElementById('addMemberModal').classList.remove('hidden')" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                    + Add First Member
                </button>
            </div>
        @endforelse
    </div>
</div>

<!-- Add Member Modal -->
<div id="addMemberModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-user-plus text-emerald-400"></i>
                <span>Add New Member</span>
            </h3>
            <button onclick="document.getElementById('addMemberModal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <form action="{{ route('members.store') }}" method="POST" data-ajax="true" class="space-y-4">
            @csrf
            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Full Name</label>
                <input type="text" name="name" required placeholder="e.g. Sunita Sharma" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
            </div>

            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Phone / WhatsApp Number (Login Username)</label>
                <input type="text" name="phone" placeholder="e.g. 9876543210" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
            </div>

            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Custom Login Password (Optional)</label>
                <input type="password" name="password" placeholder="Default: member123" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
            </div>

            <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onclick="document.getElementById('addMemberModal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400">Save Member</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit Member Modal -->
<div id="editMemberModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-user-pen text-blue-400"></i>
                <span>Edit Member Details</span>
            </h3>
            <button onclick="document.getElementById('editMemberModal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <form id="editMemberForm" action="" method="POST" data-ajax="true" class="space-y-4">
            @csrf
            @method('PUT')
            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Full Name</label>
                <input type="text" name="name" id="edit_member_name" required class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
            </div>

            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Phone / WhatsApp Number</label>
                <input type="text" name="phone" id="edit_member_phone" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
            </div>

            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Member Password</label>
                <input type="text" name="password" id="edit_member_password" placeholder="e.g. member123" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-amber-300 font-bold focus:outline-none">
            </div>

            <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onclick="document.getElementById('editMemberModal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-400">Update Member</button>
            </div>
        </form>
    </div>
</div>
@endsection

@section('scripts')
<script>
    function openEditMemberModal(id, name, phone, password) {
        const form = document.getElementById('editMemberForm');
        form.action = `/members/${id}`;
        document.getElementById('edit_member_name').value = name;
        document.getElementById('edit_member_phone').value = phone || '';
        document.getElementById('edit_member_password').value = password || 'member123';
        document.getElementById('editMemberModal').classList.remove('hidden');
    }
</script>
@endsection
